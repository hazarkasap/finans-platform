-- CreateIndex
CREATE UNIQUE INDEX "Bill_linkedTransactionId_key" ON "Bill"("linkedTransactionId");

-- AddForeignKey
ALTER TABLE "Bill" ADD CONSTRAINT "Bill_linkedTransactionId_fkey" FOREIGN KEY ("linkedTransactionId") REFERENCES "Transaction"("id") ON DELETE SET NULL ON UPDATE CASCADE;
