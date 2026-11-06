/**
 * Where customers send bank transfers — the pre-order deposit and the delivery
 * charge on regular orders. One copy, shared by the emails, checkout and the
 * account page, so a changed account is changed everywhere.
 */
export const BANK_DETAILS = {
  accountName: "H.M.W.B. Kulathunga",
  bank: "Hatton National Bank (HNB) — Matale Branch",
  accountNumber: "065020379824",
  /** Display form of the WhatsApp number payment slips can be sent to. */
  whatsappDisplay: "+94 77 836 2755",
  whatsappLink: "https://wa.me/94778362755",
} as const;
