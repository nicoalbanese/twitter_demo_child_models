import { z } from "zod";

import { useState, useTransition } from "react";
import { useFormStatus } from "react-dom";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/use-toast";
import { useValidatedForm } from "@/lib/hooks/useValidatedForm";

import { type Action, cn } from "@/lib/utils";
import { type TAddOptimistic } from "@/app/books/useOptimisticBooks";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useBackPath } from "@/components/shared/BackButton";


import { Checkbox } from "@/components/ui/checkbox"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { type Book, insertBookParams } from "@/lib/db/schema/books";
import {
  createBookAction,
  deleteBookAction,
  updateBookAction,
} from "@/lib/actions/books";
import { type Author, type AuthorId } from "@/lib/db/schema/authors";

const BookForm = ({
  authors,
  authorId,
  book,
  openModal,
  closeModal,
  addOptimistic,
  postSuccess,
}: {
  book?: Book | null;
  authors: Author[];
  authorId?: AuthorId
  openModal?: (book?: Book) => void;
  closeModal?: () => void;
  addOptimistic?: TAddOptimistic;
  postSuccess?: () => void;
}) => {
  const { errors, hasErrors, setErrors, handleChange } =
    useValidatedForm<Book>(insertBookParams);
  const { toast } = useToast();
  const editing = !!book?.id;
  
  const [isDeleting, setIsDeleting] = useState(false);
  const [pending, startMutation] = useTransition();

  const router = useRouter();
  const backpath = useBackPath("books");


  const onSuccess = (
    action: Action,
    data?: { error: string; values: Book },
  ) => {
    const failed = Boolean(data?.error);
    if (failed) {
      openModal && openModal(data?.values);
    } else {
      router.refresh();
      postSuccess && postSuccess();
    }

    toast({
      title: failed ? `Failed to ${action}` : "Success",
      description: failed ? data?.error ?? "Error" : `Book ${action}d!`,
      variant: failed ? "destructive" : "default",
    });
  };

  const handleSubmit = async (data: FormData) => {
    setErrors(null);

    const payload = Object.fromEntries(data.entries());
    const bookParsed = await insertBookParams.safeParseAsync({ authorId, ...payload });
    if (!bookParsed.success) {
      setErrors(bookParsed?.error.flatten().fieldErrors);
      return;
    }

    closeModal && closeModal();
    const values = bookParsed.data;
    const pendingBook: Book = {
      updatedAt: book?.updatedAt ?? new Date(),
      createdAt: book?.createdAt ?? new Date(),
      id: book?.id ?? "",
      userId: book?.userId ?? "",
      ...values,
    };
    try {
      startMutation(async () => {
        addOptimistic && addOptimistic({
          data: pendingBook,
          action: editing ? "update" : "create",
        });

        const error = editing
          ? await updateBookAction({ ...values, id: book.id })
          : await createBookAction(values);

        const errorFormatted = {
          error: error ?? "Error",
          values: pendingBook 
        };
        onSuccess(
          editing ? "update" : "create",
          error ? errorFormatted : undefined,
        );
      });
    } catch (e) {
      if (e instanceof z.ZodError) {
        setErrors(e.flatten().fieldErrors);
      }
    }
  };

  return (
    <form action={handleSubmit} onChange={handleChange} className={"space-y-8"}>
      {/* Schema fields start */}
              <div>
        <Label
          className={cn(
            "mb-2 inline-block",
            errors?.title ? "text-destructive" : "",
          )}
        >
          Title
        </Label>
        <Input
          type="text"
          name="title"
          className={cn(errors?.title ? "ring ring-destructive" : "")}
          defaultValue={book?.title ?? ""}
        />
        {errors?.title ? (
          <p className="text-xs text-destructive mt-2">{errors.title[0]}</p>
        ) : (
          <div className="h-6" />
        )}
      </div>
<div>
        <Label
          className={cn(
            "mb-2 inline-block",
            errors?.completed ? "text-destructive" : "",
          )}
        >
          Completed
        </Label>
        <br />
        <Checkbox defaultChecked={book?.completed} name={'completed'} className={cn(errors?.completed ? "ring ring-destructive" : "")} />
        {errors?.completed ? (
          <p className="text-xs text-destructive mt-2">{errors.completed[0]}</p>
        ) : (
          <div className="h-6" />
        )}
      </div>

      {authorId ? null : <div>
        <Label
          className={cn(
            "mb-2 inline-block",
            errors?.authorId ? "text-destructive" : "",
          )}
        >
          Author
        </Label>
        <Select defaultValue={book?.authorId} name="authorId">
          <SelectTrigger
            className={cn(errors?.authorId ? "ring ring-destructive" : "")}
          >
            <SelectValue placeholder="Select a author" />
          </SelectTrigger>
          <SelectContent>
          {authors?.map((author) => (
            <SelectItem key={author.id} value={author.id.toString()}>
              {author.id}{/* TODO: Replace with a field from the author model */}
            </SelectItem>
           ))}
          </SelectContent>
        </Select>
        {errors?.authorId ? (
          <p className="text-xs text-destructive mt-2">{errors.authorId[0]}</p>
        ) : (
          <div className="h-6" />
        )}
      </div> }
      {/* Schema fields end */}

      {/* Save Button */}
      <SaveButton errors={hasErrors} editing={editing} />

      {/* Delete Button */}
      {editing ? (
        <Button
          type="button"
          disabled={isDeleting || pending || hasErrors}
          variant={"destructive"}
          onClick={() => {
            setIsDeleting(true);
            closeModal && closeModal();
            startMutation(async () => {
              addOptimistic && addOptimistic({ action: "delete", data: book });
              const error = await deleteBookAction(book.id);
              setIsDeleting(false);
              const errorFormatted = {
                error: error ?? "Error",
                values: book,
              };

              onSuccess("delete", error ? errorFormatted : undefined);
            });
            router.push(backpath);
          }}
        >
          Delet{isDeleting ? "ing..." : "e"}
        </Button>
      ) : null}
    </form>
  );
};

export default BookForm;

const SaveButton = ({
  editing,
  errors,
}: {
  editing: Boolean;
  errors: boolean;
}) => {
  const { pending } = useFormStatus();
  const isCreating = pending && editing === false;
  const isUpdating = pending && editing === true;
  return (
    <Button
      type="submit"
      className="mr-2"
      disabled={isCreating || isUpdating || errors}
      aria-disabled={isCreating || isUpdating || errors}
    >
      {editing
        ? `Sav${isUpdating ? "ing..." : "e"}`
        : `Creat${isCreating ? "ing..." : "e"}`}
    </Button>
  );
};
