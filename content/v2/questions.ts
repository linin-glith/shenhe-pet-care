/**
 * Buyer questions — the board on the sourcing-guides page.
 *
 * WHAT THIS IS FOR
 * A buyer who cannot find the answer to one question does not buy and does
 * not ask; they leave. So the questions themselves become the content: the
 * three most recent ones are shown, a new one pushes the oldest out of the
 * visible three, and everything that falls off goes to the back office where
 * it is answered once and then written into a guide.
 *
 * THE DATA MODEL — what the order system will use
 *   id         stable identifier
 *   question   the question as a BUYER phrases it, not as we would
 *   market     the market line it is about, when it is about one
 *   guideHref  the guide that answers it
 *   guideLabel what that guide is called
 *   askedAt    ISO timestamp
 *   answered   whether a public answer exists yet
 *
 * TODAY THERE IS NO BACK END
 * The site is a static export, so the board is seeded with the questions the
 * factory is actually asked, and a question sent from this browser is kept in
 * that browser and handed to WhatsApp. The moment the order system is live it
 * becomes: read the newest three from the API, POST new questions to it, and
 * let the back office take the overflow. The `TODO(client-input)` markers
 * below name exactly what has to exist for that.
 */

export type BuyerQuestion = {
  id: string;
  question: string;
  market?: 'US' | 'EU' | 'AU';
  guideHref: string;
  guideLabel: string;
  askedAt: string;
  answered: boolean;
};

/** How many questions the board shows. */
export const QUESTIONS_BOARD_SIZE = 3;

/**
 * The seed.
 *
 * These are the questions importers actually send, each one answered by the
 * per-market guide on the same page — so the board points at an answer rather
 * than at a dead end.
 */
export const seedQuestions: BuyerQuestion[] = [
  {
    id: 'q-cpnp-eu',
    question: 'Do I need a CPNP notification before I can sell in the EU — and who files it?',
    market: 'EU',
    guideHref: '/sourcing-guides.html#eu',
    guideLabel: 'EU compliance detail',
    askedAt: '2026-09-28',
    answered: true,
  },
  {
    id: 'q-facility-us',
    question: 'Who handles customs clearance on the US side — you, or my own broker?',
    market: 'US',
    guideHref: '/sourcing-guides.html#us',
    guideLabel: 'US compliance detail',
    askedAt: '2026-09-28',
    answered: true,
  },
  {
    id: 'q-apvma-au',
    question: 'Is the product already registered with APVMA, or do I have to do that myself?',
    market: 'AU',
    guideHref: '/sourcing-guides.html#anz',
    guideLabel: 'AU & NZ compliance detail',
    askedAt: '2026-09-28',
    answered: true,
  },
];

/**
 * TODO(client-input): the order system replaces the seed.
 *   - GET  {api}/questions?limit=3   -> the three most recent, newest first
 *   - POST {api}/questions           -> a new question, returns the id
 *   - the back office archives anything older than the visible three
 */
