import axios from 'axios';

/**
 * EduAI API Test Script
 * 
 * Usage: 
 * 1. Get your Firebase ID token (you can find it in the browser console by running `await user.getIdToken()`)
 * 2. Run: node scripts/test-api.mjs <your_token> <your_uid>
 */

const token = process.argv[2];
const uid = process.argv[3];
const baseUrl = 'http://localhost:3000/api';

if (!token || !uid) {
    console.error('Usage: node scripts/test-api.mjs <firebase_token> <uid>');
    process.exit(1);
}

const headers = {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json'
};

const runTests = async () => {
    console.log('🚀 Starting API Tests...\n');

    try {
        // 1. Test Fetching Lectures
        console.log('--- Testing GET /lectures/[uid] ---');
        const lecturesRes = await axios.get(`${baseUrl}/lectures/${uid}`, { headers });
        console.log('✅ Status:', lecturesRes.status);
        console.log('Found', lecturesRes.data?.length || 0, 'lectures.\n');

        // 2. Test Fetching Tasks
        console.log('--- Testing GET /tasks/[uid] ---');
        const tasksRes = await axios.get(`${baseUrl}/tasks/${uid}`, { headers });
        console.log('✅ Status:', tasksRes.status);
        console.log('Found', tasksRes.data?.length || 0, 'tasks.\n');

        // 3. Test Process Lecture (Dry Run with placeholder if no actual audio provided)
        console.log('--- Testing POST /process-lecture ---');
        try {
            const processRes = await axios.post(`${baseUrl}/process-lecture`, {
                audioUrl: 'https://yrzbqxbtnsevy0nsjlab.supabase.co/storage/v1/object/public/lectures/test.mp3', // Dummy URL
                subject: 'Test Subject ' + Date.now(),
                teacherId: uid
            }, { headers });
            console.log('✅ Status:', processRes.status);
            console.log('Processed:', processRes.data.lectureId, '\n');

            const lectureId = processRes.data.lectureId;

            // 4. Test Fetching Summary for the new lecture
            console.log(`--- Testing GET /summary/${lectureId} ---`);
            const summaryRes = await axios.get(`${baseUrl}/summary/${lectureId}`, { headers });
            console.log('✅ Status:', summaryRes.status);
            console.log('Summary Content:', summaryRes.data.shortSummary.substring(0, 50), '...\n');

        } catch (err) {
            console.error('❌ POST /process-lecture failed (likely due to STT/Gemini quota or dummy URL)');
            console.error('Error:', err.response?.data || err.message, '\n');
        }

        console.log('✨ All tests completed!');
    } catch (err) {
        console.error('❌ Test failed with error:');
        if (err.response) {
            console.error('Status:', err.response.status);
            console.error('Data:', JSON.stringify(err.response.data, null, 2));
        } else {
            console.error(err.message);
        }
    }
};

runTests();
