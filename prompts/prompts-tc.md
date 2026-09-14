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
