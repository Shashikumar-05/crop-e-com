const Counter = require('../models/Counter');

const generateOrderId = async () => {
  const currentDate = new Date();
  const currentMonth = currentDate.getMonth() + 1; // 1-12
  const currentYear = currentDate.getFullYear();
  
  // Unique counter ID for each month-year combination
  const counterId = `order_${currentYear}_${currentMonth}`;

  // Atomically increment the sequence, or create it if it doesn't exist
  const counter = await Counter.findByIdAndUpdate(
    counterId,
    { $inc: { seq: 1 } },
    { new: true, upsert: true }
  );

  const sequenceNumber = counter.seq;
  
  // Format with at least 4 digits
  const paddedSequence = sequenceNumber.toString().padStart(4, '0');
  const orderId = `#K${paddedSequence}`;

  return {
    order_id: orderId,
    order_month: currentMonth,
    order_year: currentYear
  };
};

module.exports = { generateOrderId };
