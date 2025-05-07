import { useLocation } from "react-router-dom";
import { SideNavigation } from "@cloudscape-design/components";
import useLink from "../../hooks/useLink";

function Navigation() {
  const location = useLocation();
  const { handleFollow } = useLink();

  return (
    <SideNavigation
      activeHref={location.pathname}
      header={{ href: "/", text: "Documents" }}
      onFollow={handleFollow}
      items={[
        {
          type: "section",
          text: "Onboarding",
          items: [
            {
              type: "link",
              text: "All Onboarding",
              href: "/onboarding"
            },
            {
              type: "link",
              text: "Outstanding Onboarding",
              href: "/onboarding/outstanding"
            }
          ]
        },
        {
          type: "section",
          text: "Analysis",
          items: [
            {
              type: "link",
              text: "All Analysis",
              href: "/analysis"
            },
          ]
        },
        {
          type: "section",
          text: "Prompt Management",
          items: [
            {
              type: "link",
              text: "All Prompts",
              href: "/prompts"
            },
          ]
        },
        { type: "divider" },
        {
          type: "link",
          text: "Documentation",
          href: "https://github.com/",
          external: true
        }
      ]}
    />
  );
}

export default Navigation;
