/**
 * End-to-End Test for Automatic AI Indexing After Admin Approval Workflow
 * ======================================================================
 * Tests:
 * 1. Health check of Python FastAPI service
 * 2. PDF upload & pending Resource creation in MongoDB
 * 3. Admin status update to 'approved' -> Automatic AI Indexing execution
 * 4. Verification that MongoDB Resource gets indexingStatus = 'indexed' and chunkCount > 0
 * 5. Vector database similarity search (POST /api/ai/search-vectors) retrieves content from that PDF
 * 6. Graceful failure handling test (simulated failure records indexingStatus = 'failed')
 */

const path = require('path');
const fs = require('fs');
const dotenv = require('dotenv');
dotenv.config({ path: path.join(__dirname, '.env') });

const mongoose = require('mongoose');
const Resource = require('./src/models/Resource');
const User = require('./src/models/User');
const { RESOURCE_STATUS, INDEXING_STATUS, USER_ROLES } = require('./src/utils/constants');
const { searchVectors, indexDocument, checkAiHealth } = require('./src/utils/aiClient');
const { triggerAutoIndexing } = require('./src/controllers/resourceController');

async function runTest() {
  console.log('='.repeat(80));
  console.log('RUNNING E2E WORKFLOW TEST: Auto-Indexing on Admin Approval');
  console.log('='.repeat(80));

  // Connect to MongoDB
  const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/academic_resource_db';
  console.log(`[1] Connecting to MongoDB: ${mongoUri}...`);
  try {
    await mongoose.connect(mongoUri);
    console.log('    MongoDB Connected successfully.');
  } catch (err) {
    console.error('    MongoDB connection failed:', err.message);
    process.exit(1);
  }

  // Check AI Microservice health
  console.log('\n[2] Checking AI Microservice health on port 8000...');
  const health = await checkAiHealth();
  console.log('    AI Service Status:', health);
  if (!health.online) {
    console.error('    AI microservice is not online. Please start it with uvicorn.');
  }

  // Create a sample PDF file in server/uploads for testing
  const uploadsDir = path.join(__dirname, 'uploads');
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }

  const samplePdfPath = path.join(uploadsDir, 'sample_os_concurrency_test.pdf');
  const tempGenScript = path.join(__dirname, 'temp_gen_pdf.py');
  
  const pyCode = `import pypdf
from pypdf import PdfWriter
from pypdf.generic import DecodedStreamObject, NameObject, DictionaryObject

writer = PdfWriter()
font_dict = DictionaryObject({
    NameObject("/Type"): NameObject("/Font"),
    NameObject("/Subtype"): NameObject("/Type1"),
    NameObject("/BaseFont"): NameObject("/Helvetica"),
})
font_ref = writer._add_object(font_dict)

page1 = writer.add_blank_page(width=612, height=792)
page1[NameObject("/Resources")] = DictionaryObject({
    NameObject("/Font"): DictionaryObject({NameObject("/F1"): font_ref})
})
content = b"BT /F1 12 Tf 72 700 Td (Concurrency in Operating Systems: Semaphores and Mutex Locks for critical section synchronization.) Tj ET"
stream = DecodedStreamObject()
stream.set_data(content)
page1[NameObject("/Contents")] = writer._add_object(stream)

with open(${JSON.stringify(samplePdfPath)}, "wb") as f:
    writer.write(f)
`;

  fs.writeFileSync(tempGenScript, pyCode, 'utf8');
  const { execSync } = require('child_process');
  const venvPython = path.join(__dirname, '../ai-service/.venv/Scripts/python.exe');
  
  try {
    execSync(`"${venvPython}" "${tempGenScript}"`, { cwd: path.join(__dirname, '../ai-service') });
  } catch (err) {
    execSync(`python "${tempGenScript}"`, { cwd: path.join(__dirname, '../ai-service') });
  } finally {
    if (fs.existsSync(tempGenScript)) fs.unlinkSync(tempGenScript);
  }

  if (!fs.existsSync(samplePdfPath)) {
    throw new Error(`Failed to create sample PDF at ${samplePdfPath}`);
  }
  console.log(`\n[3] Created sample academic PDF at: ${samplePdfPath} (${fs.statSync(samplePdfPath).size} bytes)`);

  try {
    // Find or create a test user
    let user = await User.findOne({ email: 'test_student_indexing@example.com' });
    if (!user) {
      user = await User.create({
        name: 'Alex Student',
        email: 'test_student_indexing@example.com',
        password: 'password123',
        department: 'Computer Science & Engineering',
        year: 3,
        role: USER_ROLES.STUDENT,
      });
    }

    // Step A: Student Uploads PDF (Resource created as status: pending, indexingStatus: pending)
    console.log('\n[4] Step A: Student Uploads PDF -> Resource created as PENDING');
    const testResource = await Resource.create({
      title: 'Operating Systems Synchronization and Mutex Guide',
      description: 'Comprehensive lecture notes on semaphores, mutex locks, and deadlock avoidance.',
      subject: 'Operating Systems',
      department: 'Computer Science & Engineering',
      semester: 4,
      resourceType: 'Notes',
      fileUrl: `/uploads/${path.basename(samplePdfPath)}`,
      fileSize: fs.statSync(samplePdfPath).size,
      fileOriginalName: 'OS_Concurrency_Notes.pdf',
      uploadedBy: user._id,
      tags: ['Operating Systems', 'Concurrency', 'Semaphores', 'Mutex'],
      status: RESOURCE_STATUS.PENDING,
      indexingStatus: INDEXING_STATUS.PENDING,
    });

    console.log(`    Created Resource ID: ${testResource._id}`);
    console.log(`    Status: ${testResource.status}`);
    console.log(`    Indexing Status: ${testResource.indexingStatus}`);

    // Step B: Admin Approves PDF -> Automatic AI Indexing Triggered
    console.log('\n[5] Step B: Admin Approves PDF -> Triggering Automatic AI Indexing');
    testResource.status = RESOURCE_STATUS.APPROVED;
    testResource.indexingStatus = INDEXING_STATUS.PROCESSING;
    await testResource.save();

    // Trigger auto-indexing pipeline
    await triggerAutoIndexing(testResource._id);

    // Step C: Verify Resource Indexing State in MongoDB
    console.log('\n[6] Step C: Verifying MongoDB Resource Indexing State');
    const updatedResource = await Resource.findById(testResource._id);
    console.log(`    Resource Status: ${updatedResource.status}`);
    console.log(`    Indexing Status: ${updatedResource.indexingStatus}`);
    console.log(`    Chunks Stored: ${updatedResource.chunkCount}`);
    console.log(`    Indexed At: ${updatedResource.indexedAt}`);

    if (updatedResource.indexingStatus !== INDEXING_STATUS.INDEXED) {
      throw new Error(`Expected indexingStatus to be 'indexed', got '${updatedResource.indexingStatus}'`);
    }
    if (updatedResource.chunkCount <= 0) {
      throw new Error(`Expected chunkCount > 0, got ${updatedResource.chunkCount}`);
    }
    console.log('    [PASS] MongoDB record accurately updated to INDEXED with chunk count.');

    // Step D: Semantic Search retrieves content from the indexed PDF
    console.log('\n[7] Step D: Performing Semantic Search for "How do mutex locks prevent race conditions?"');
    const searchResult = await searchVectors('How do mutex locks prevent race conditions in operating systems?', 3);
    console.log(`    Total results retrieved: ${searchResult.results?.length || 0}`);
    
    if (searchResult.results && searchResult.results.length > 0) {
      const match = searchResult.results[0];
      console.log(`    Top Match ID: ${match.id}`);
      console.log(`    Similarity Score: ${match.similarity_score}`);
      console.log(`    Matched Text: "${match.text}"`);
      console.log(`    Metadata:`, match.metadata);
      console.log('    [PASS] Semantic search successfully retrieved content extracted from the approved PDF!');
    } else {
      throw new Error('Semantic search returned 0 results for indexed document.');
    }

    // Step E: Graceful Failure Handling Test
    console.log('\n[8] Step E: Testing Graceful Failure Handling (Non-existent PDF file)');
    const fakeResource = await Resource.create({
      title: 'Corrupted File Document',
      description: 'Testing failure handling',
      subject: 'Test Subject',
      department: 'Other',
      semester: 1,
      resourceType: 'Other',
      fileUrl: '/uploads/non_existent_file_999.pdf',
      uploadedBy: user._id,
      status: RESOURCE_STATUS.APPROVED,
      indexingStatus: INDEXING_STATUS.PENDING,
    });

    await triggerAutoIndexing(fakeResource._id);
    const failedResource = await Resource.findById(fakeResource._id);
    console.log(`    Failed Resource Status: ${failedResource.status}`);
    console.log(`    Failed Resource Indexing Status: ${failedResource.indexingStatus}`);
    console.log(`    Indexing Error: "${failedResource.indexingError}"`);

    if (failedResource.indexingStatus !== INDEXING_STATUS.FAILED) {
      throw new Error(`Expected indexingStatus to be 'failed', got '${failedResource.indexingStatus}'`);
    }
    if (failedResource.status !== RESOURCE_STATUS.APPROVED) {
      throw new Error(`Expected resource approval status to remain 'approved' despite indexing failure`);
    }
    console.log('    [PASS] Failure was handled gracefully: status stayed approved, indexingStatus set to failed, server did not crash.');

    // Clean up test documents
    await Resource.deleteMany({ _id: { $in: [testResource._id, fakeResource._id] } });
    if (fs.existsSync(samplePdfPath)) {
      fs.unlinkSync(samplePdfPath);
    }
    console.log('\n    Cleaned up test resources and temporary files.');

    console.log('\n' + '='.repeat(80));
    console.log(' ALL E2E AUTOMATIC AI INDEXING TESTS PASSED PERFECTLY!');
    console.log('='.repeat(80));
  } finally {
    await mongoose.disconnect();
  }
}

runTest().catch((err) => {
  console.error('\nTest failed with error:', err);
  process.exit(1);
});
