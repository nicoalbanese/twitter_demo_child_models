import { Suspense } from "react";
import { notFound } from "next/navigation";

import { getBookByIdWithQuotesAndReflections } from "@/lib/api/books/queries";
import { getAuthors } from "@/lib/api/authors/queries";
import OptimisticBook from "@/app/books/[bookId]/OptimisticBook";
import { checkAuth } from "@/lib/auth/utils";
import QuoteList from "@/components/quotes/QuoteList";
import ReflectionList from "@/components/reflections/ReflectionList";

import { BackButton } from "@/components/shared/BackButton";
import Loading from "@/app/loading";
import ReviewForm from "@/components/reviews/ReviewForm";

export const revalidate = 0;

export default async function BookPage({
  params,
}: {
  params: { bookId: string };
}) {
  return (
    <main className="overflow-auto">
      <Book id={params.bookId} />
    </main>
  );
}

const Book = async ({ id }: { id: string }) => {
  await checkAuth();

  const { book, quotes, reflections, reviews } =
    await getBookByIdWithQuotesAndReflections(id);
  const { authors } = await getAuthors();
  const hasReview = reviews ? reviews?.length > 0 : false;

  if (!book) notFound();
  return (
    <Suspense fallback={<Loading />}>
      <div className="relative">
        <BackButton currentResource="books" />
        <OptimisticBook
          book={book}
          authors={authors}
          authorId={book.authorId}
        />
      </div>
      {book.completed === true ? (
        hasReview === false ? (
          <div className="border border-border">
            <div className="p-8">
              <h3 className="text-xl font-medium">
                Write a review about {book.title}
              </h3>
              <p>
                Now that you&lsquo;ve finished the book, what did you think?
              </p>
              <ReviewForm books={[]} bookId={book.id} />
            </div>
          </div>
        ) : (
          <div>
            <h3 className="text-xl font-medium">Your Review</h3>
            <p>{hasReview ? reviews[0].content : ""}</p>
          </div>
        )
      ) : null}
      <div className="relative mt-8 mx-4">
        <h3 className="text-xl font-medium mb-4">{book.title}&apos;s Quotes</h3>
        <QuoteList books={[]} bookId={book.id} quotes={quotes} />
      </div>
      <div className="relative mt-8 mx-4">
        <h3 className="text-xl font-medium mb-4">
          {book.title}&apos;s Reflections
        </h3>
        <ReflectionList books={[]} bookId={book.id} reflections={reflections} />
      </div>
    </Suspense>
  );
};
