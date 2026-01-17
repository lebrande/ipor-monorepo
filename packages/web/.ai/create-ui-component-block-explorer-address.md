In `src/components/ui/block-explorer-address.ts` create a component that takes ethereum address like
`0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913` and displays it like `0x8335...2913` using
`src/utils/truncate-hex.ts`. The component should contain all the features listed in
`acceptance-criteria`.

The function should accept props:

<component-props>
- address - ethereum address to use
- visibleDigits
- label - optional, if provided use it instead of truncated address
</component-props>

<acceptance-criteria>
- truncated address or label should be a link to block explorer
- next to the link there is a copy icon button which allows to copy entire address
- once user clicks the copy button, the message `Address copied!` pops out
- when users hovers over the component, and there is another component with the same address, both components should be highlighted to inform user these addresses are the same
</acceptance-criteria>

Use following shadcn components

<shadcn-components>
- https://ui.shadcn.com/docs/components/tooltip - for the message
</shadcn-components>

<shadcn-helper>
`.cursor/rules/ui-shadcn-helper.mdc`
</shadcn-helper>

Write also a test suite for that component. Follow rules in files:

<testing-rules>
`.cursor/rules/testing.mdc`
</testing-rules>
