/**
 * The answer paragraph.
 *
 * WHAT IT IS
 * Two sentences under the headline: the answer, and the limit of the
 * answer.
 *
 * WHY IT IS ITS OWN COMPONENT
 * The pages are built in three different ways — some hand-built, some
 * from a legacy content file, some from a v2 block list — and their
 * hero sections do not share a structure. One component means one
 * place where the answer is written, so the answer cannot drift from
 * the claim on the page, and the styling is the same everywhere.
 *
 * WHY THE BOUNDARY IS IN THE SAME BLOCK
 * A paragraph that gives the answer and nothing else is a sales line.
 * The limit is what makes it an answer a buyer can act on: what it
 * covers, and what it does not. Both sentences are on the page
 * together, because separating them would let the answer travel alone.
 */
import type { PageAnswer as PageAnswerData } from '@/content/v2/answers';

export default function PageAnswer({ answer, boundary }: PageAnswerData) {
  return (
    <div className="mt-6 max-w-2xl border-l-2 border-v2-accent-500/70 pl-5">
      <p className="v2-lead--light text-[1.05rem] leading-relaxed text-white/90">
        {answer}
      </p>
      <p className="mt-3 text-sm leading-relaxed text-white/60">
        {boundary}
      </p>
    </div>
  );
}
