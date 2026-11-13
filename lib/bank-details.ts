/**
 * Where the money goes.
 *
 * WHY THIS FILE EXISTS
 * A buyer who has accepted a quotation has to pay, and they cannot pay
 * into a page on a website: the money goes to a bank account, by wire
 * transfer, or to a foreign currency account, and the buyer has to be
 * told which one and whose name it is in.
 *
 * So the payment details are data, not text in a page. That matters for
 * two reasons:
 *
 *   - the same details have to appear in the portal, in the quotation
 *     email, and in the documents the buyer downloads, and a version
 *     of an account number typed into three places is three chances to
 *     be wrong;
 *   - a bank account is not something to invent. It is a fact about the
 *     company, and it changes when the company changes banks.
 *
 * WHY IT MAY BE EMPTY
 * It may be empty, and when it is empty the portal says so in words
 * rather than showing a blank box. An empty table reads as a mistake; a
 * sentence that says the details come with the quotation reads as a
 * process.
 *
 * WHAT IS NOT HERE
 * No online payment. There is no card, no wallet, no gateway: the
 * buyer pays by bank transfer into the company's account, which is what
 * a buyer in Russia, Brazil or Germany does with a Chinese factory, and
 * the portal's job is to tell them where to send it and to show them
 * when it arrived.
 */

export type BankAccount = {
  /** The label the buyer sees: "Company account (USD)" and so on. */
  label: string;
  /** Whose name the account is in. */
  beneficiary: string;
  /** The bank. */
  bank: string;
  /** The branch, where it helps. */
  branch?: string;
  /** The account number, as a string, because it has leading zeros. */
  accountNumber?: string;
  /** The SWIFT or BIC, for a foreign currency transfer. */
  swift?: string;
  /** The IBAN, where there is one. */
  iban?: string;
  /** The address the bank is at. */
  bankAddress?: string;
  /** What the buyer has to write in the transfer reference. */
  reference?: string;
  /** What this account is for. */
  note?: string;
};

export type BankDetails = {
  /** The accounts, in the order they should be offered. */
  accounts: BankAccount[];
  /** The payment terms, in the buyer's language. */
  terms?: string[];
  /**
   * When the details are not on the page yet, this is what the buyer
   * reads instead of a table.
   */
  fallback?: string;
};

/**
 * The company's payment details.
 *
 * EMPTY ON PURPOSE UNTIL THE DETAILS ARE CONFIRMED.
 *
 * A bank account is a fact, and the facts about this company are the
 * ones in PROVENANCE.md. Until the account that money should actually
 * go into is written down here, the portal must not show a table of
 * numbers - a wrong account number is worse than no account number.
 *
 * To publish them: fill in the accounts below, and the portal, the
 * quotation email and the order documents will all read from here.
 */
export const BANK_DETAILS: BankDetails = {
  accounts: [
    // {
    //   label: 'Company account (USD) — wire transfer',
    //   beneficiary: 'Guangdong Shenhe Zhongke Biotechnology Co., Ltd.',
    //   bank: '…',
    //   branch: '…',
    //   accountNumber: '…',
    //   swift: '…',
    //   bankAddress: '…',
    //   reference: 'the quotation number (QT-…)',
    //   note: 'T/T 30% deposit, balance against the copy bill of lading.',
    // },
  ],
  terms: [
    // The deposit split is 35%, and it is read from the same place the
    // published site reads it: content/v2/shipping.json carries the order
    // flow, and the terms of service state 35% T/T deposit + 65% balance
    // before shipment. This line used to say 30%, and it was the only copy
    // of the figure on the site that did — a portal page that would have
    // told a buyer a different number the moment the bank details were
    // filled in.
    'T/T: 35% deposit when the order is confirmed, the balance against the copy bill of lading.',
    'L/C at sight from USD 30,000.',
    'The buyer pays the freight and any duty; both are quoted separately from the goods.',
    'Name the quotation number in the transfer reference, so the payment can be matched to the order.',
  ],
  fallback:
    'Our payment details are sent with your quotation and are also in your account. If they are not there, ask your sales manager and we will send them again.',
};

/** Whether the details are published, or the fallback has to be used. */
export function hasBankDetails(): boolean {
  return BANK_DETAILS.accounts.length > 0;
}
