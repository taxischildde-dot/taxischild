# TaxiSchild Update TODO

- [x] Replace the outdated repository contents with the validated project files from the supplied archive, without retaining a nested project directory.
- [x] Add a cancellation-reason field and a required cancellation prompt for cancelled pre-booked trips.
- [x] Enforce company and role checks in client-side data helpers to prevent accidental cross-company access within the local application.
- [x] Preserve configured company branding in visible interface and report headings wherever appropriate.
- [x] Verify that bookings, drivers, vehicles, daily logs, and PDF exports work after the changes.
- [x] Run linting, automated tests, and production build checks.
- [x] Commit and push the validated update to the public GitHub repository.
- [x] Document that localStorage filtering is not a substitute for secure server-side multi-tenancy and password authentication.
- [x] Add deferred-billing methods for Krankenkasse and Gemeinde/Schulfahrten across the trip workflow and reports.
- [x] Make the trip price optional and display an explicit pending-price state until the company finalizes invoicing.
- [ ] Test the revised booking, reporting, and PDF workflows and publish the update to GitHub.
- [x] Add a flexible responsible-driver assignment control to vehicle creation and editing.
- [x] Allow replacing or clearing one or more responsible drivers from the fleet interface without deleting the vehicle.
- [x] Add regression coverage for company-scoped vehicle driver assignments and clearing assignments.
- [ ] Test the fleet assignment workflow and update the GitHub repository.
