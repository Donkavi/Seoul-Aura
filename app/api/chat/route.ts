import { NextRequest, NextResponse } from "next/server";
import {
  generateContent,
  stripDataUrl,
  GeminiError,
  type GeminiContent,
  type GeminiPart,
} from "@/lib/gemini";
import {
  buildSystemPrompt,
  getCatalogSummary,
  findMentionedProducts,
  findStockedMatch,
  getProductsByIds,
  getStoreInfo,
  lookupOrder,
  searchProducts,
  toClientProduct,
  toModelProduct,
  TOOL_DECLARATIONS,
  type SearchArgs,
} from "@/lib/chatAgent";
import type { ChatBlock, ChatTurn } from "@/types";
import type { Product } from "@/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** How many search → recommend round-trips the agent gets before we cut it off. */
const MAX_TOOL_ROUNDS = 5;
const MAX_HISTORY_TURNS = 16;
const MAX_MESSAGE_CHARS = 2000;
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

/* ------------------------------------------------------------------ */
/*  Rate limiting                                                      */
/* ------------------------------------------------------------------ */

const RATE_LIMIT = 20;
const RATE_WINDOW_MS = 60 * 1000;
const hits = new Map<string, number[]>();

function rateLimited(ip: string): boolean {
  const now = Date.now();
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < RATE_WINDOW_MS);
  recent.push(now);
  hits.set(ip, recent);

  // Opportunistic sweep so the map cannot grow without bound on a long-lived server.
  if (hits.size > 5000) {
    hits.forEach((times, key) => {
      if (!times.some((t: number) => now - t < RATE_WINDOW_MS)) hits.delete(key);
    });
  }
  return recent.length > RATE_LIMIT;
}

/* ------------------------------------------------------------------ */
/*  Request shape                                                      */
/* ------------------------------------------------------------------ */

interface ChatRequestBody {
  message?: string;
  image?: { mimeType: string; data: string };
  history?: ChatTurn[];
}

const ALLOWED_IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/heic"]);

/** Tools that only draw UI — they tell the model nothing it needs to think about. */
const UI_ONLY_TOOLS = new Set(["recommend_products", "suggest_product_request", "navigate"]);

/** Rebuild Gemini history from the plain {role, text} turns the browser keeps. */
function toGeminiHistory(history: ChatTurn[]): GeminiContent[] {
  return history
    .slice(-MAX_HISTORY_TURNS)
    .filter((t) => typeof t.text === "string" && t.text.trim())
    .map((t) => ({
      role: t.role === "assistant" ? ("model" as const) : ("user" as const),
      parts: [{ text: t.text.slice(0, MAX_MESSAGE_CHARS) }],
    }));
}

export async function POST(req: NextRequest) {
  try {
    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0].trim() ??
      req.headers.get("x-real-ip") ??
      "unknown";

    if (rateLimited(ip)) {
      return NextResponse.json(
        { error: "You are sending messages a little too fast — give it a moment." },
        { status: 429 }
      );
    }

    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json(
        { error: "The assistant is not configured yet. Please contact us directly." },
        { status: 503 }
      );
    }

    const body = (await req.json()) as ChatRequestBody;
    const message = (body.message ?? "").trim().slice(0, MAX_MESSAGE_CHARS);
    const image = body.image;

    if (!message && !image) {
      return NextResponse.json({ error: "Say something first." }, { status: 400 });
    }

    const userParts: GeminiPart[] = [];
    if (image?.data) {
      if (!ALLOWED_IMAGE_TYPES.has(image.mimeType)) {
        return NextResponse.json(
          { error: "Please send a JPG, PNG or WEBP image." },
          { status: 400 }
        );
      }
      const base64 = stripDataUrl(image.data);
      // base64 inflates by ~4/3, so this bounds the decoded image size.
      if (base64.length * 0.75 > MAX_IMAGE_BYTES) {
        return NextResponse.json({ error: "That image is too large." }, { status: 413 });
      }
      userParts.push({ inlineData: { mimeType: image.mimeType, data: base64 } });
    }
    userParts.push({
      text: message || "Here is a photo — please take a look and tell me what you would suggest.",
    });

    const catalog = await getCatalogSummary();
    const system = buildSystemPrompt(catalog, "Seoul Aura");

    const contents: GeminiContent[] = [
      ...toGeminiHistory(body.history ?? []),
      { role: "user", parts: userParts },
    ];

    /* ---------------------------------------------------------------- */
    /*  Agent loop                                                       */
    /* ---------------------------------------------------------------- */

    const blocks: ChatBlock[] = [];
    // Products the model surfaced, keyed by id, so the browser can render cards
    // and Add to Cart without a second round-trip.
    const productMap: Record<string, Product> = {};
    const ctx: ToolContext = {
      blocks,
      productMap,
      lastSearchIds: [],
      lastSearchRelevant: false,
      searchCount: 0,
    };
    let text = "";

    for (let round = 0; round < MAX_TOOL_ROUNDS; round++) {
      // On the last round we forbid new tool calls, which forces the model to
      // stop searching and actually answer the shopper.
      const isFinalRound = round === MAX_TOOL_ROUNDS - 1;

      const result = await generateContent({
        system,
        contents,
        tools: TOOL_DECLARATIONS,
        toolMode: isFinalRound ? "NONE" : "AUTO",
        temperature: 0.6,
        maxOutputTokens: 2048,
      });

      if (result.text) text = result.text;

      if (!result.functionCalls.length) break;

      // Echo the model turn back verbatim — thought signatures must survive intact.
      contents.push({ role: "model", parts: result.parts });

      const responseParts: GeminiPart[] = [];
      let anyToolFailed = false;

      for (const call of result.functionCalls) {
        const args = (call.args ?? {}) as Record<string, unknown>;
        let response: Record<string, unknown>;

        try {
          response = await runTool(call.name, args, ctx);
        } catch (err) {
          console.error(`chat tool ${call.name} failed`, err);
          response = { error: "That lookup failed. Tell the shopper briefly and offer to try again." };
        }

        if (response.error) anyToolFailed = true;
        responseParts.push({
          functionResponse: { id: call.id, name: call.name, response },
        });
      }

      contents.push({ role: "user", parts: responseParts });

      // Every request to Gemini counts against a small free-tier daily quota, so
      // skip the closing round when it would add nothing: the model has already
      // written its reply and only asked for UI, not for information. A failed
      // tool still needs a round — the model has to correct what it just said.
      const uiOnly = result.functionCalls.every((c) => UI_ONLY_TOOLS.has(c.name));
      if (uiOnly && result.text && !anyToolFailed) break;
    }

    // Safety net: the model occasionally names a product in prose instead of
    // calling recommend_products, leaving the shopper reading a name with no way
    // to buy it. Give anything it named a card with an Add to Cart button.
    if (text) {
      const alreadyShown = new Set(
        blocks.flatMap((b) => (b.kind === "products" ? b.productIds : []))
      );
      const mentioned = await findMentionedProducts(text, alreadyShown, 3);

      if (mentioned.length) {
        mentioned.forEach((p) => {
          productMap[String(p._id)] = toClientProduct(p);
        });
        const recovered: ChatBlock = {
          kind: "products",
          productIds: mentioned.map((p) => String(p._id)),
          reason: "Available from us now",
        };
        // Sit above any "we don't stock this" card — what we *do* have comes first.
        const requestAt = blocks.findIndex((b) => b.kind === "request");
        if (requestAt === -1) blocks.push(recovered);
        else blocks.splice(requestAt, 0, recovered);
      }
    }

    // The model sometimes proposes an outside product in prose and asks whether to
    // source it, instead of calling the tool — leaving the shopper with a question
    // and no button. Recover the product name and raise the request for them.
    if (text && !blocks.some((b) => b.kind === "request") && proposesOutsideProduct(text)) {
      await recoverOutsideRequest({ system, contents, text, ctx });
    }

    // If the model looked products up and then rendered no cards at all, it meant
    // to show them and forgot — its reply usually still says "here are some
    // options". The prose safety net above cannot catch this when the reply is
    // written in Sinhala or Tamil, since no English product name appears in it.
    // Having searched and found relevant matches is signal enough: show them.
    const requestIndex = blocks.findIndex((b) => b.kind === "request");
    const hasProductCards = blocks.some((b) => b.kind === "products");

    if (!hasProductCards && ctx.lastSearchRelevant && ctx.lastSearchIds.length) {
      const alternatives = await getProductsByIds(ctx.lastSearchIds.slice(0, 3));
      if (alternatives.length) {
        alternatives.forEach((p) => {
          productMap[String(p._id)] = toClientProduct(p);
        });
        const rescued: ChatBlock = {
          kind: "products",
          productIds: alternatives.map((p) => String(p._id)),
          reason: requestIndex === -1 ? "From our shelves" : "Closest we have in store right now",
        };
        // splice(-1) would land before the last block, so append when there is
        // no request card to sit above.
        if (requestIndex === -1) blocks.push(rescued);
        else blocks.splice(requestIndex, 0, rescued);
      }
    }

    // What the shopper can buy always reads before what we have to order in,
    // whichever order the model happened to call the tools in.
    const RENDER_ORDER: Record<ChatBlock["kind"], number> = { products: 0, link: 1, request: 2 };
    const sorted = blocks
      .map((block, i) => ({ block, i }))
      .sort((a, b) => RENDER_ORDER[a.block.kind] - RENDER_ORDER[b.block.kind] || a.i - b.i)
      .map((entry) => entry.block);

    // A product can reach the blocks by more than one route in a single turn —
    // recommended by the model, and again via the already-stocked guard or the
    // prose safety net. Show each card once, in the first place it appeared.
    const seenProductIds = new Set<string>();
    const ordered = sorted
      .map((block) => {
        if (block.kind !== "products") return block;
        const unique = block.productIds.filter((id) => !seenProductIds.has(id));
        unique.forEach((id) => seenProductIds.add(id));
        return { ...block, productIds: unique };
      })
      .filter((block) => block.kind !== "products" || block.productIds.length > 0);

    if (!text) {
      text = ordered.some((b) => b.kind === "products")
        ? "Here is what I would suggest from our shelves — tap a card to add it to your cart."
        : "Sorry, I did not quite catch that. Could you tell me a bit more about your skin or hair concern?";
    }

    return NextResponse.json({ text, blocks: ordered, products: productMap });
  } catch (err) {
    if (err instanceof GeminiError) {
      console.error("Gemini error", err.message);

      // A 429 here is usually the daily free-tier allowance, not a momentary
      // spike, so "try again in a moment" would be a lie — point them at a human.
      const exhausted = err.status === 429;
      const overloaded = exhausted || err.status === 503;

      return NextResponse.json(
        {
          error: exhausted
            ? "Aura has reached her limit of conversations for now. Please try again later, or contact us directly and the team will help."
            : overloaded
              ? "The assistant is very busy right now. Please try again in a moment."
              : "The assistant hit a problem. Please try again.",
        },
        { status: overloaded ? 503 : 500 }
      );
    }
    console.error("chat route error", err);
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
}

/* ------------------------------------------------------------------ */
/*  Outside-product recovery                                           */
/* ------------------------------------------------------------------ */

/**
 * Phrases the model reaches for when it names a product we do not stock but
 * forgets to raise the request — usually while asking permission it was told not
 * to ask for. Deliberately generous: a false positive only costs one extra call,
 * which is then told to do nothing.
 */
const OUTSIDE_PRODUCT_HINTS = [
  /\b(?:do|does)(?:n't| not)\s+(?:currently\s+)?(?:carry|stock|have|sell)\b/i,
  /\bnot\s+(?:currently\s+)?(?:in|on)\s+(?:our|the)\s+(?:shelves|range|store|lineup|catalogue|catalog)\b/i,
  /\boutside\s+(?:of\s+)?our\b/i,
  /\bwould you like (?:us|me) to (?:source|order|bring|find|request)\b/i,
  /\bshall (?:we|i) (?:source|order|bring)\b/i,
  /\b(?:source|bring) (?:it|that|this|them) in\b/i,
  /\blook into\b/i,
];

function proposesOutsideProduct(text: string): boolean {
  return OUTSIDE_PRODUCT_HINTS.some((rx) => rx.test(text));
}

/** Sentinel the model returns when its reply proposed nothing to source. */
const NOTHING_TO_REQUEST = "NONE";

/**
 * Asks the model, in one narrow follow-up, to formalise the product it just named
 * in prose. Tool calling is forced so the answer comes back structured rather than
 * as more prose we would have to parse.
 */
async function recoverOutsideRequest({
  system,
  contents,
  text,
  ctx,
}: {
  system: string;
  contents: GeminiContent[];
  text: string;
  ctx: ToolContext;
}): Promise<void> {
  const declaration = TOOL_DECLARATIONS.find((t) => t.name === "suggest_product_request");
  if (!declaration) return;

  try {
    const result = await generateContent({
      system,
      contents: [
        ...contents,
        { role: "model", parts: [{ text }] },
        {
          role: "user",
          parts: [
            {
              text:
                "System check, not a shopper message. Your reply above may have named a product this store does not stock. " +
                `If it did, call suggest_product_request for that exact product now so the shopper gets a button to request it. ` +
                `If it named no such product, call it with productName exactly "${NOTHING_TO_REQUEST}".`,
            },
          ],
        },
      ],
      tools: [declaration],
      toolMode: "ANY",
      allowedFunctionNames: ["suggest_product_request"],
      temperature: 0,
      maxOutputTokens: 512,
    });

    const call = result.functionCalls[0];
    if (!call) return;

    const args = (call.args ?? {}) as Record<string, unknown>;
    const name = String(args.productName ?? "").trim();
    if (!name || name.toUpperCase() === NOTHING_TO_REQUEST) return;

    // Routed through runTool so the already-stocked guard still applies.
    await runTool("suggest_product_request", args, ctx);
  } catch (err) {
    // A missing button is a worse outcome than a slow reply, but not worth failing
    // the whole message over.
    console.error("outside-request recovery failed", err);
  }
}

/* ------------------------------------------------------------------ */
/*  Tool dispatch                                                      */
/* ------------------------------------------------------------------ */

/** Shared state the tools write into as the agent works through a turn. */
interface ToolContext {
  blocks: ChatBlock[];
  productMap: Record<string, Product>;
  /** Latest search hits, so a request card can still offer real alternatives. */
  lastSearchIds: string[];
  lastSearchRelevant: boolean;
  searchCount: number;
}

/**
 * Searching is cheap for the model but costs us a full round-trip each time, and
 * a turn spent searching is a turn not spent answering. After a couple of tries
 * it has seen what the catalogue holds and should commit.
 */
const SEARCH_SOFT_LIMIT = 2;

async function runTool(
  name: string,
  args: Record<string, unknown>,
  ctx: ToolContext
): Promise<Record<string, unknown>> {
  const { blocks, productMap } = ctx;

  switch (name) {
    case "search_products": {
      const { products: found, relevant } = await searchProducts(args as SearchArgs);
      ctx.searchCount += 1;
      if (found.length) {
        ctx.lastSearchIds = found.map((p) => String(p._id));
        ctx.lastSearchRelevant = relevant;
      }

      const exhausted = ctx.searchCount >= SEARCH_SOFT_LIMIT;
      const guidance = !found.length
        ? "The catalogue is empty for this search. Tell the shopper honestly and call suggest_product_request."
        : relevant
          ? "These are ranked best-first. Judge them yourself: recommend the ones that genuinely suit the shopper, and if none do, call suggest_product_request instead."
          : "Nothing matched the search terms — these are just the store's general stock, NOT matches for this concern. Do not pretend they suit. Either search again with different wording (an ingredient or product type), or tell the shopper honestly and call suggest_product_request.";

      return {
        count: found.length,
        products: found.map(toModelProduct),
        note: exhausted
          ? `${guidance} You have now searched ${ctx.searchCount} times — STOP SEARCHING. Decide using what you have already seen: call recommend_products, or suggest_product_request, and then write your reply.`
          : guidance,
      };
    }

    case "get_product_details": {
      const [product] = await getProductsByIds([String(args.productId ?? "")]);
      if (!product) return { found: false, note: "No product with that id." };
      return {
        found: true,
        ...toModelProduct(product),
        fullDescription: (product.description ?? "").slice(0, 1500),
        variants: product.variants ?? [],
      };
    }

    case "recommend_products": {
      const ids = Array.isArray(args.productIds) ? args.productIds.map(String) : [];
      let products = await getProductsByIds(ids.slice(0, 4));

      // Rather than leave the shopper with an empty reply when the model garbles
      // an id, fall back to the top of its own last search.
      if (!products.length && ctx.lastSearchIds.length) {
        products = await getProductsByIds(ctx.lastSearchIds.slice(0, 3));
      }
      if (!products.length) {
        return {
          shown: 0,
          error: "None of those ids exist. Search again and use ids exactly as returned.",
        };
      }
      products.forEach((p) => {
        productMap[String(p._id)] = toClientProduct(p);
      });
      blocks.push({
        kind: "products",
        productIds: products.map((p) => String(p._id)),
        reason: typeof args.reason === "string" ? args.reason : undefined,
      });
      return {
        shown: products.length,
        note: "Cards are now on screen with Add to Cart buttons. Do not repeat the names or prices in your reply — just explain why they suit the shopper.",
      };
    }

    case "suggest_product_request": {
      const requestedName = String(args.productName ?? "").slice(0, 160);
      const requestedBrand = args.brand ? String(args.brand).slice(0, 80) : undefined;

      // Never tell a shopper we lack something that is sitting in our catalogue.
      const stocked = await findStockedMatch(requestedName, requestedBrand);
      if (stocked) {
        const id = String(stocked._id);
        productMap[id] = toClientProduct(stocked);

        const existing = blocks.find(
          (b): b is Extract<ChatBlock, { kind: "products" }> => b.kind === "products"
        );
        if (existing) {
          if (!existing.productIds.includes(id)) existing.productIds.push(id);
        } else {
          blocks.push({ kind: "products", productIds: [id], reason: "We stock this" });
        }

        return {
          shown: 0,
          error: `We DO sell "${stocked.name}" (id ${id}) — no request is needed and none was created. Its card is now on screen. Tell the shopper we have it and recommend it; do NOT say we do not stock it.`,
        };
      }

      blocks.push({
        kind: "request",
        productName: requestedName,
        brand: requestedBrand,
        category: args.category ? String(args.category).slice(0, 80) : undefined,
        concern: args.concern ? String(args.concern).slice(0, 80) : undefined,
        reason: args.reason ? String(args.reason).slice(0, 300) : undefined,
      });
      return {
        shown: 1,
        note: "A 'Request this product' button is now on screen. Tell the shopper we do not stock it yet and that they can ask us to bring it in.",
      };
    }

    case "navigate": {
      const raw = String(args.path ?? "");
      // Only same-site paths — never let the model emit an outbound link.
      const path = raw.startsWith("/") && !raw.startsWith("//") ? raw : "/shop";
      blocks.push({ kind: "link", path, label: String(args.label ?? "Browse the shop").slice(0, 60) });
      return { shown: 1, note: "A link button is now on screen." };
    }

    case "get_store_info":
      return await getStoreInfo();

    case "lookup_order":
      return await lookupOrder(String(args.orderNumber ?? ""), String(args.email ?? ""));

    default:
      return { error: `Unknown tool ${name}` };
  }
}

