# Example Documents

Run the seed script to generate and index a small compliance PDF:

```bash
pnpm --filter @cdc/api db:seed
```

The script creates `uploads/acme-compliance-policy.pdf`, stores its document metadata, extracts page-aware text, chunks it, embeds it, and writes chunks into PostgreSQL with pgvector embeddings.
