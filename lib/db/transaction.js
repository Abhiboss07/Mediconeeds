import mongoose from "mongoose";

/**
 * Run a callback function within a MongoDB transaction if supported by the deployment.
 * Gracefully falls back to running without a transaction if the database is standalone.
 * 
 * @param {Function} callback - (session) => Promise<any>
 * @returns {Promise<any>}
 */
export async function runTransaction(callback) {
  const session = await mongoose.startSession();
  try {
    session.startTransaction();
    const result = await callback(session);
    await session.commitTransaction();
    return result;
  } catch (err) {
    const msg = String(err.message || err);
    // Check if the error is related to transactions not being supported (e.g., replica set required)
    const notSupported = 
      msg.includes("replica set") || 
      msg.includes("transaction") || 
      msg.includes("retryWrites") || 
      err.code === 20 || // TransactionSystemFailed
      err.code === 251;  // NoSuchTransaction

    if (notSupported) {
      console.warn("[TRANSACTION_FALLBACK] MongoDB deployment does not support transactions; running non-transactionally.");
      session.endSession();
      return callback(null);
    }
    
    await session.abortTransaction();
    throw err;
  } finally {
    session.endSession();
  }
}
