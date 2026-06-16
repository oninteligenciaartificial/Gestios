# DentalGest + GestiOS complementary mode

## Positioning

DentalGest is the clinical system. GestiOS is the operational module.

The customer should buy this as one ONIA suite, but internally each product keeps its ownership:

- DentalGest: patients, appointments, treatments, doctors and clinical records.
- GestiOS: stock, suppliers, purchase orders, expiry control, cash and operational reporting.

## First implementation

GestiOS now supports `businessType = "DENTAL"`.

This changes labels and defaults for:

- Inventory: `Inventario Dental`.
- Categories: `Areas de Insumos`.
- Suppliers: `Proveedores Dentales`.
- Products: `Insumos`.
- Expiry control: enabled.
- Sample data: dental supplies.

## Navigation bridge

DentalGest can open GestiOS with:

```txt
/inventory?source=dentalgest&returnTo=<encoded DentalGest URL>
```

GestiOS will show a contextual banner:

- identifies the screen as the DentalGest operational module;
- explains that it handles inventory, purchases, suppliers and stock;
- shows a return action when `returnTo` is provided.

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
