const express = require("express");
const router = express.Router();
const admin = require("firebase-admin");
const { verifyToken } = require('../../utils');




// Endpoint to get user data from Firestore
router.use(express.urlencoded({ extended: true }));
router.post('/', verifyToken, async (req, res) => {
    const { categoryId, amount,date, description} = req.body;
 
     try {                                            
        // Add an expense sub-collection for each user
     await admin.firestore().collection('users').doc(req.uid).collection('expenses').add({
    categoryId: categoryId,
    amount: amount,
    date:date,
    description:description,
    created_at: admin.firestore.FieldValue.serverTimestamp(),  
    
   
});

 
res.json({ message: 'Added an expenses successfully',});
    } catch (error) {
        console.error('Error fetching user data:', error);
        res.status(500).json({ success: false, error: 'Server error' });
    }
});


// Endpoint to get all expenses with category details
router.get('/', verifyToken, async (req, res) => {
    try {
        // Fetch all expenses
        const expensesSnapshot = await admin.firestore().collection('users').doc(req.uid).collection('expenses').get();
        const expenses = expensesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        // Fetch all categories
        const categoriesSnapshot = await admin.firestore().collection('users').doc(req.uid).collection('categories').get();
        const categories = {};
        categoriesSnapshot.docs.forEach(doc => {
            categories[doc.id] = doc.data();
        });

        // Map category title and description to each expense
        const expensesWithCategoryDetails = expenses.map(expense => ({
            ...expense,
            categoryTitle: categories[expense.categoryId]?.categoryTitle  || 'Unknown Category',
            categoryDescription: categories[expense.categoryId]?.description || 'No Description'
        }));

        res.json({ success: true, expenses: expensesWithCategoryDetails });
    } catch (error) {
        console.error('Error fetching expenses:', error);
        res.status(500).json({ success: false, error: 'Server error' });
    }
});


// Endpoint to update an expense
router.put('/:expenseId', verifyToken, async (req, res) => {
    const { expenseId } = req.params;
    const { categoryId, amount, date, description } = req.body;

    try {
        const expenseRef = admin.firestore().collection('users').doc(req.uid).collection('expenses').doc(expenseId);
        await expenseRef.update({
            categoryId: categoryId,
            amount: amount,
            date: date,
            description: description,
            updated_at: admin.firestore.FieldValue.serverTimestamp(),
        });

        res.json({ success: true, message: 'Expense updated successfully',data:{amount: amount,
            date: date,
            description: description} });
    } catch (error) {
        console.error('Error updating expense:', error);
        res.status(500).json({ success: false, error: 'Server error' });
    }
});

// Endpoint to delete an expense
router.delete('/:expenseId', verifyToken, async (req, res) => {
    const { expenseId } = req.params;

    try {
        const expenseRef = admin.firestore().collection('users').doc(req.uid).collection('expenses').doc(expenseId);
        await expenseRef.delete();

        res.json({ success: true, message: 'Expense deleted successfully' });
    } catch (error) {
        console.error('Error deleting expense:', error);
        res.status(500).json({ success: false, error: 'Server error' });
    }
});



module.exports = router;