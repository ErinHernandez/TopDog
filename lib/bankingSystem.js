export const createDeposit = async (amount, method, userData) => {
  // Mock implementation - in real app this would integrate with actual banking system
  console.log(`Creating deposit of $${amount} using ${method} for user ${userData?.id}`);
  
  // Simulate API call delay
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  return {
    success: true,
    transactionId: `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    amount: amount,
    method: method,
    timestamp: new Date().toISOString(),
    status: 'pending'
  };
}; 