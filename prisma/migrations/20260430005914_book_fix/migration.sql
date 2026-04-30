-- DropForeignKey
ALTER TABLE "BookLoan" DROP CONSTRAINT "BookLoan_bookId_fkey";

-- AddForeignKey
ALTER TABLE "BookLoan" ADD CONSTRAINT "BookLoan_bookId_fkey" FOREIGN KEY ("bookId") REFERENCES "Book"("isbn") ON DELETE RESTRICT ON UPDATE CASCADE;
