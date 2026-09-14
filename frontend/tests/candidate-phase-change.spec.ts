import { test, expect } from '@playwright/test';

/**
 * Escenario 2 — Cambio de fase de un candidato
 * 
 * Focus: Valida el flujo completo de mover un candidato entre fases:
 * - Se puede arrastrar una tarjeta de una columna a otra (drag and drop).
 * - La tarjeta aparece visualmente en la nueva columna.
 * - Se dispara una peticion PUT /candidates/:id al backend.
 * - El body contiene la nueva fase y la respuesta es exitosa.
 */

test.describe('Escenario 2 — Cambio de fase de un candidato', () => {
  let requestIntercepted = false;
  let requestBody: any = null;

  test.beforeEach(async ({ page, context }) => {
    // Mock API responses
    
    // Mock positions list
    await context.route('http://localhost:3010/positions', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          { id: 1, title: 'Frontend Developer', contactInfo: 'John Doe', applicationDeadline: '2024-12-31', status: 'Open' }
        ])
      });
    });

    // Mock interview flow for position 1
    await context.route('http://localhost:3010/positions/1/interviewFlow', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          interviewFlow: {
            positionName: 'Frontend Developer',
            interviewFlow: {
              interviewSteps: [
                { id: 1, name: 'CV Review' },
                { id: 2, name: 'Technical Interview' },
                { id: 3, name: 'Final Interview' },
                { id: 4, name: 'Offer' }
              ]
            }
          }
        })
      });
    });

    // Mock candidates for position 1
    await context.route('http://localhost:3010/positions/1/candidates', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          { candidateId: 1, fullName: 'Alice Smith', averageScore: 4, applicationId: 101, currentInterviewStep: 'CV Review' },
          { candidateId: 2, fullName: 'Bob Johnson', averageScore: 5, applicationId: 102, currentInterviewStep: 'CV Review' },
          { candidateId: 3, fullName: 'Charlie Brown', averageScore: 3, applicationId: 103, currentInterviewStep: 'Technical Interview' }
        ])
      });
    });

    // Intercept PUT requests to candidates endpoint
    await context.route(/http:\/\/localhost:3010\/candidates\/\d+/, async (route) => {
      requestIntercepted = true;
      const request = route.request();
      requestBody = request.postData();
      
      // Verify the request contains the expected data
      const body = JSON.parse(requestBody);
      expect(body.applicationId).toBeDefined();
      expect(body.currentInterviewStep).toBeDefined();
      
      // Respond with success
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true })
      });
    });
  });

  test('Valida el flujo completo de mover un candidato entre fases', async ({ page }) => {
    // Reset intercepted flag
    requestIntercepted = false;
    requestBody = null;
    
    // Navigate to positions page
    await page.goto('/positions');
    
    // Wait for positions to load
    await expect(page.getByText('Frontend Developer')).toBeVisible();
    
    // Click "Ver proceso" button to navigate to position details
    const viewProcessButton = page.getByRole('button', { name: /Ver proceso/i }).first();
    await expect(viewProcessButton).toBeVisible();
    await viewProcessButton.click();
    
    // Wait for navigation to position details page
    await page.waitForURL(/positions\/\d+/);
    
    // Verify we're on the position page
    await expect(page.getByRole('heading', { name: 'Frontend Developer', level: 2 })).toBeVisible();
    
    // ============================================
    // TEST 1: Se puede arrastrar una tarjeta de una columna a otra
    // ============================================
    
    // Locate the source and target columns
    const cvReviewColumn = page.getByText('CV Review').locator('..').filter({ has: page.getByText('CV Review') });
    const techInterviewColumn = page.getByText('Technical Interview').locator('..').filter({ has: page.getByText('Technical Interview') });
    
    // Locate the candidate card to drag (Alice Smith in CV Review)
    const aliceCard = cvReviewColumn.getByText('Alice Smith');
    await expect(aliceCard).toBeVisible();
    
    // Get the bounding boxes for drag and drop
    const aliceCardBox = await aliceCard.boundingBox();
    const techInterviewBox = await techInterviewColumn.boundingBox();
    
    // Calculate drop position (middle of the Technical Interview column)
    const dropX = techInterviewBox.x + techInterviewBox.width / 2;
    const dropY = techInterviewBox.y + techInterviewBox.height / 2;
    
    // Calculate drag start position (middle of Alice Smith card)
    const startX = aliceCardBox.x + aliceCardBox.width / 2;
    const startY = aliceCardBox.y + aliceCardBox.height / 2;
    
    // Perform drag and drop
    await page.mouse.move(startX, startY);
    await page.mouse.down();
    await page.mouse.move(dropX, dropY);
    await page.mouse.up();
    
    // ============================================
    // TEST 2: La tarjeta aparece visualmente en la nueva columna
    // ============================================
    
    // Wait for the drag and drop animation to complete
    await page.waitForTimeout(500);
    
    // Verify Alice Smith is now in Technical Interview column
    await expect(techInterviewColumn.getByText('Alice Smith')).toBeVisible();
    
    // Verify Alice Smith is no longer in CV Review column
    await expect(cvReviewColumn.getByText('Alice Smith')).toHaveCount(0);
    
    // ============================================
    // TEST 3: Se dispara una peticion PUT /candidates/:id al backend
    // ============================================
    
    // Wait a moment for the request to be triggered
    await page.waitForTimeout(300);
    
    // Verify a PUT request was intercepted
    expect(requestIntercepted).toBeTruthy();
    
    // ============================================
    // TEST 4: El body contiene la nueva fase y la respuesta es exitosa
    // ============================================
    
    // Verify the request body contains the new phase
    expect(requestBody).toBeTruthy();
    
    const body = JSON.parse(requestBody);
    
    // The applicationId should match Alice Smith's (101)
    expect(body.applicationId).toBe(101);
    
    // The currentInterviewStep should be the new phase ID (2 for Technical Interview)
    expect(body.currentInterviewStep).toBe(2);
  });
});
