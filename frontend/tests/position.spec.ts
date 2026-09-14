import { test, expect } from '@playwright/test';

/**
 * Escenario 1 — Carga de la página `position`
 * 
 * Focus: Valida que la pantalla carga correctamente:
 * - El título de la posición se muestra.
 * - Las columnas de fases del proceso están presentes.
 * - Los candidatos aparecen en la columna correcta según su fase.
 */

test.describe('Escenario 1 — Carga de la página position', () => {
  test.beforeEach(async ({ page, context }) => {
    // Mock API responses for the position details page
    
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
          { candidateId: 3, fullName: 'Charlie Brown', averageScore: 3, applicationId: 103, currentInterviewStep: 'Technical Interview' },
          { candidateId: 4, fullName: 'Diana Prince', averageScore: 5, applicationId: 104, currentInterviewStep: 'Final Interview' }
        ])
      });
    });
  });

  test('Valida que la pantalla carga correctamente', async ({ page }) => {
    // Directly navigate to position details page to avoid webpack overlay iframe issues
    await page.goto('/positions/1');
    
    // Wait for position details to load
    await page.waitForURL(/positions\/\d+/);
    
    // ============================================
    // TEST 1: El título de la posición se muestra
    // ============================================
    const positionTitle = page.getByRole('heading', { name: 'Frontend Developer', level: 2 });
    await expect(positionTitle).toBeVisible();
    
    // ============================================
    // TEST 2: Las columnas de fases del proceso están presentes
    // ============================================
    const expectedPhases = ['CV Review', 'Technical Interview', 'Final Interview', 'Offer'];
    
    for (const phase of expectedPhases) {
      await expect(page.getByText(phase)).toBeVisible();
    }
    
    // ============================================
    // TEST 3: Los candidatos aparecen en la columna correcta según su fase
    // ============================================
    
    // Find the CV Review column
    const cvReviewHeader = page.getByText('CV Review');
    const cvReviewColumn = cvReviewHeader.locator('..').filter({ has: cvReviewHeader });
    
    // Verify Alice Smith and Bob Johnson are in CV Review
    await expect(cvReviewColumn.getByText('Alice Smith')).toBeVisible();
    await expect(cvReviewColumn.getByText('Bob Johnson')).toBeVisible();
    
    // Find the Technical Interview column
    const techInterviewHeader = page.getByText('Technical Interview');
    const techInterviewColumn = techInterviewHeader.locator('..').filter({ has: techInterviewHeader });
    
    // Verify Charlie Brown is in Technical Interview
    await expect(techInterviewColumn.getByText('Charlie Brown')).toBeVisible();
    
    // Find the Final Interview column
    const finalInterviewHeader = page.getByText('Final Interview');
    const finalInterviewColumn = finalInterviewHeader.locator('..').filter({ has: finalInterviewHeader });
    
    // Verify Diana Prince is in Final Interview
    await expect(finalInterviewColumn.getByText('Diana Prince')).toBeVisible();
    
    // Negative tests: Verify candidates are NOT in wrong columns
    // Diana Prince should NOT be in CV Review
    await expect(cvReviewColumn.getByText('Diana Prince')).toHaveCount(0);
    
    // Charlie Brown should NOT be in CV Review
    await expect(cvReviewColumn.getByText('Charlie Brown')).toHaveCount(0);
    
    // Alice Smith should NOT be in Technical Interview
    await expect(techInterviewColumn.getByText('Alice Smith')).toHaveCount(0);
  });
});
