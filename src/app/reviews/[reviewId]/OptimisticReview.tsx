"use client";

import { useOptimistic, useState } from "react";
import { TAddOptimistic } from "@/app/reviews/useOptimisticReviews";
import { type Review } from "@/lib/db/schema/reviews";
import { cn } from "@/lib/utils";

import { Button } from "@/components/ui/button";
import Modal from "@/components/shared/Modal";
import ReviewForm from "@/components/reviews/ReviewForm";
import { type Book, type BookId } from "@/lib/db/schema/books";

export default function OptimisticReview({ 
  review,
  books,
  bookId 
}: { 
  review: Review; 
  
  books: Book[];
  bookId?: BookId
}) {
  const [open, setOpen] = useState(false);
  const openModal = (_?: Review) => {
    setOpen(true);
  };
  const closeModal = () => setOpen(false);
  const [optimisticReview, setOptimisticReview] = useOptimistic(review);
  const updateReview: TAddOptimistic = (input) =>
    setOptimisticReview({ ...input.data });

  return (
    <div className="m-4">
      <Modal open={open} setOpen={setOpen}>
        <ReviewForm
          review={review}
          books={books}
        bookId={bookId}
          closeModal={closeModal}
          openModal={openModal}
          addOptimistic={updateReview}
        />
      </Modal>
      <div className="flex justify-between items-end mb-4">
        <h1 className="font-semibold text-2xl">{review.content}</h1>
        <Button className="" onClick={() => setOpen(true)}>
          Edit
        </Button>
      </div>
      <pre
        className={cn(
          "bg-secondary p-4 rounded-lg break-all text-wrap",
          optimisticReview.id === "optimistic" ? "animate-pulse" : "",
        )}
      >
        {JSON.stringify(optimisticReview, null, 2)}
      </pre>
    </div>
  );
}
