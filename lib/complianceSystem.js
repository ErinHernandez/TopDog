export const canMakeDeposits = async (userData, country) => {
  // Mock implementation - in real app this would check compliance status
  console.log(`Checking compliance for user ${userData?.id} in ${country}`);
  
  // Simulate API call delay
  await new Promise(resolve => setTimeout(resolve, 500));
  
  // Mock compliance check - in real app this would check actual compliance status
  return {
    approved: true,
    status: 'approved',
    restrictions: [],
    message: 'User is compliant and can make deposits'
  };
}; 