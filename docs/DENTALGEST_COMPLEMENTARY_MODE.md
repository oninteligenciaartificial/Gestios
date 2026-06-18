# DentalGest + GestiOS complementary mode

## Positioning

DentalGest is the clinical system. GestiOS is the operational module.

The customer should buy this as one ONIA suite, but internally each product keeps its ownership:

- DentalGest: patients, appointments, treatments, doctors and clinical records.
- GestiOS: stock, suppliers, purchase orders, expiry control, cash and operational reporting.

## First implementation

GestiOS now supports `businessType = "DENTAL"`.

This is intentionally not a new billing enum value in `PlanType`.

- Billing plans remain `BASICO`, `CRECER`, `PRO` and `EMPRESARIAL`.
- The DentalGest organization mode is controlled by `businessType = "DENTAL"`.
- In product and sales language this can be called `plan operativo: dentalgest`, but the database plan remains the commercial plan purchased by the customer.

This changes labels and defaults for:

- Inventory: `Inventario Dental`.
- Categories: `Areas de Insumos`.
- Suppliers: `Proveedores Dentales`.
- Products: `Insumos`.
- Expiry control: enabled.
- Sample data: dental supplies.

## DentalGest operational scope

When an organization has `businessType = "DENTAL"`, GestiOS behaves as a DentalGest operational module.

The dashboard navigation is restricted to:

- Dashboard.
- Notifications.
- Dental inventory.
- Dental suppliers.
- Purchase orders.
- Supply areas/categories.
- Settings.
- Help.
- Support.

Billing remains accessible because it is an account-management function.

The following GestiOS store modules are intentionally hidden and route-guarded from DentalGest mode:

- Point of sale.
- Sales.
- Store orders.
- Customers.
- General reports.
- Cash closing.
- Online store.
- Discounts.
- Branches.
- WhatsApp conversations.
- Staff/team.
- GestiOS add-ons and public customer registration.

The goal is to avoid mixing store operations with DentalGest clinical operations while still reusing the GestiOS inventory, purchasing and supplier engine.

## Navigation bridge

DentalGest can open GestiOS with:

```txt
/inventory?source=dentalgest&returnTo=<encoded DentalGest URL>
```

GestiOS will show a contextual banner:

- identifies the screen as the DentalGest operational module;
- explains that it handles inventory, purchases, suppliers and stock;
- shows a return action when `returnTo` is provided.

## Interactive onboarding

The onboarding tour is scoped by organization, plan and business mode.

For DentalGest mode it only shows the modules available in the customer's current commercial plan and uses DentalGest-specific labels. After the welcome screen, the tour becomes a non-blocking coach panel:

- highlights the target sidebar item;
- lets the user click the real module;
- advances only when the user clicks `Ya lo abri`;
- can only be closed by explicitly finishing or pressing `Saltar tour`.

This prevents a user from accidentally skipping context without an intentional action, while still allowing them to learn by clicking through the real interface.

## Guardrails

Do not add these to GestiOS:

- odontogram;
- dental treatments;
- clinical history;
- medical consent;
- doctor schedule;
- patient clinical record.

Those remain DentalGest features.

## Next integration step

Add server-to-server read endpoints only after deciding the auth model and tenant mapping:

- DentalGest clinic id to GestiOS organization id.
- Shared ONIA account identity or explicit mapping table.
- Scoped API token per clinic, not one global key.
- Read-only stock summary first.

Avoid direct cross-app writes until the stock consumption rules per treatment are defined.
