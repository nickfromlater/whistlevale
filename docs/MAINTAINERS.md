# Preparing the contribution launch

The source and templates prepare the workflow; they do not change GitHub or
Vercel settings. Do not declare the launch complete based only on these files.

1. Review and test the prepared branch. The default branch must contain the
   agent guides, recipes, templates and validation before outside contributors
   can follow links to them. Keep the deployment decision separate from merging.
2. Review tracked files **and reachable history** for credentials, local paths,
   recordings and material that should remain private. A scanner result is
   evidence, not a guarantee that everything is appropriate for publication.
   Confirm ownership/permission for artwork and the existing license notices.
3. Confirm the owner's decision to change repository visibility. AGENTS.md
   currently requires keeping it private until explicitly requested otherwise.
   Update the README's preparation status when the public launch actually occurs.
4. Configure the default branch's rules: pull requests, required `check` CI,
   approval from the maintainer, stale-review dismissal, and blocked force pushes
   or deletion. Decide documented emergency bypass access. Verify the rule by
   inspecting a test PR. CODEOWNERS routes review; it does not restrict merge
   permissions or enforce approval on its own.
5. Review Actions permissions for outside forks. Keep the read-only token in
   `.github/workflows/checks.yml`; do not run untrusted PR code with secrets or
   use `pull_request_target` to check out a contributor's head. Review first-time
   workflows before allowing them to run. Keep generated recordings out of CI.
6. Enable and verify private vulnerability reporting if available. Review
   repository Issues/Discussions settings and pin a short welcome issue with
   one scoped train task and one scoped building task when ready to invite people.
7. Verify all contribution links as a visitor, including the site entry points.
   Site publication remains a separate, tested deployment. Ship the credit-aware
   importer before encouraging JSON exchanges through the production site. A feature branch push
   is not proof that visitors can see the new interface.

## Agent entry points

`AGENTS.md` holds shared instructions. Claude Code loads it through the root
`CLAUDE.md` import. Copilot has a small pointer in `.github/copilot-instructions.md`
and can also read AGENTS.md. Recipes contain the longer task-specific workflows;
`npm run contribute -- <kind> --json` makes their paths and checks discoverable.
Do not duplicate the full guide into several tool-specific instruction files.

These choices follow the [AGENTS.md convention](https://agents.md/),
[GitHub's repository instructions](https://docs.github.com/en/copilot/how-tos/copilot-on-github/customize-copilot/add-custom-instructions/add-repository-instructions),
and [Claude Code's documented AGENTS.md import](https://code.claude.com/docs/en/memory#agents-md).
GitHub documents [code owner review enforcement separately](https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/customizing-your-repository/about-code-owners).
