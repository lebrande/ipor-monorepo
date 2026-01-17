You are Blockchain, DeFi and frontend super developer whose task is to adjust existing feature
`depositors-list` to requirements and guides listed below.

Acceptance criteria:

- As an user, when I go to `feature-path`, then I see depositors list as it's now
- Adjust all the code to `api-endpoint` - now it provides pagination
- Add `src/components/ui/pagination.tsx` to handle pagination.
- Fetch data from `api-endpoint` and use it as dummy data like it's done in `src/flow-chart`

Tips:

- Follow the rules from `resources`.
- Follow the rules from `project-structure`.
- Read tech stack in `tech-stack`.
- Read docs for pagination: `https://ui.shadcn.com/docs/components/pagination`

<feature-path>
/vaults/:chainId/:vaultAddress/depositors
</feature-path>

<project-structure>
.cursor/rules/project-structure.mdc
</project-structure>

<api-endpoint>
http://localhost:42069/api/vaults/8453/0x0d877Dc7C8Fa3aD980DfDb18B48eC9F8768359C4/depositors
</api-endpoint>

<tech-stack>
.cursor/rules/tech-stack.mdc
</tech-stack>

<resources>
.cursor/rules/shared.mdc
</resources>
