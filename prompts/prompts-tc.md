# Prompts

## 1. Set up the system for last exercise

Consider the good practices at @ManifestoBuenasPracticas.md.

Create the frontend of a basic page for candidates state view:

Product decisions:

    a list, kanban-style
    show candidates as cards
    columns are each hiring process state
    UI allows update of process state by moving a card
    card can be moved by sliding it into another column
    when card is drag and dropped, candidate data in DB should be updated to show new hiring process state
    the process state should be shown as title over the columns
    have a arrow on the left to allow page move to positions listing
    all process states should be shown as columns, no state should be hidden
    candidates should have their full name and average score showing at their cards
    only one card per candidate
    make the page responsive as it works well on mobile as well
    when on mobile, the stets should stay on vertical
    assume that the page’s overall structure exists, we only need internal page content

Tech decisions:

    Use @dnd-kit/core for drag and drop cards
    no authentication is needed
    use existing components whenever possible
    new components can be created of needed
    follow UI known patterns
    should be a standalone page
    add a basic coverage of unit tests

Project context: @frontend

## 2. Applied feedback

As feedback from the results, fix the following points:

Bug potencial de drag&drop: la detección de columna destino depende de que over.id empiece con 'column-'. Como cada tarjeta también es droppable, soltar sobre una tarjeta existente en otra columna (el caso más común en un kanban con candidatos) no dispara la actualización de fase. Se recomienda leer over.data.current?.columnId en vez de depender del prefijo del id.
El endpoint usa interviewflow en minúsculas frente al interviewFlow del enunciado — confirmar que el routing real coincide.
new Error('mensaje:', error.response?.data) — el segundo argumento se ignora, el detalle del error del backend se pierde silenciosamente.
URL base hardcodeada en dos servicios.
Sin manejo explícito de "no hay pasos definidos".

## 3. Set up playwright

For improve tests coverage we will use playwright, thats already installed using:
npm install -D @playwright/test
npx playwright install

But `npx playwright init` fails and we need the file `playwright.config`. Fix the playwright init process

## 4. Set up playwright - reinforce PW is at FE dir

For improve tests coverage we will use playwright, thats already installed at @frontend using:
npm install -D @playwright/test
npx playwright install

But `npx playwright init` fails and we need the file `playwright.config`. Fix the playwright init process for the frontend context in this service.

## 5. First test case

Using playwright that is already installed and configured at @frontend.
We need one case, where we validate the frontend `position` page.

Test name: Escenario 1 — Carga de la página `position`

Focus: Valida que la pantalla carga correctamente:

Test should check:

- El título de la posición se muestra.
- Las columnas de fases del proceso están presentes.
- Los candidatos aparecen en la columna correcta según su fase.

Create the test using playwright and validate it can be correct ran.

## 6. Second test case

Following the tests needs, we  now want another integration test for frontend, using playwright. It should be:

Test name: Escenario 2 — Cambio de fase de un candidato

Focus: Valida el flujo completo de mover un candidato entre fases:

Test should check:

- Se puede arrastrar una tarjeta de una columna a otra (drag and drop).
- La tarjeta aparece visualmente en la nueva columna.
- Se dispara una petición `PUT /candidate/:id` al backend.
- El body contiene la nueva fase y la respuesta es exitosa.