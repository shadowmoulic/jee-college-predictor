export const tools = {
  shiksha: {
    name: "Shiksha",
    href: "https://www.shiksha.com/engineering/jee-main-college-predictor",
    scope: "The source linked here is Shiksha’s JEE Main college predictor. It describes rank, category and home-state inputs and uses historical cutoffs and counselling trends.",
    cost: "Shiksha describes the JEE Main predictor as free and says personal documents and login details are unnecessary.",
    use: "Use it when you want a second shortlist from your JEE Main rank. Record the seat pool and counsellor or admission route attached to each result where the tool makes that information available.",
  },
  careers360: {
    name: "Careers360",
    href: "https://engineering.careers360.com/jee-college-predictor",
    scope: "Careers360 describes predictors for JEE Main and JEE Advanced based on previous cutoff trends and category-wise seat information.",
    cost: "Its source page states that its free offering is limited to Session 1. Check the current access terms for the specific predictor or session you intend to use.",
    use: "Use it to cross-check a shortlist for your exam. If the access terms differ by exam session, check the relevant tool page before entering details.",
  },
};

export type ToolId = keyof typeof tools;
