import BreadcrumbGroup from "@cloudscape-design/components/breadcrumb-group";
import useLink from "../../hooks/useLink";

type BreadcrumbsProps = {
  action: string;
  href: string;
  type: string;
};

function Breadcrumbs(props: BreadcrumbsProps) {
  const { handleFollow } = useLink();
  return (
    <BreadcrumbGroup
      items={[
        { text: "Banana Shop", href: "/" },
        { text: props.action, href: props.href },
        {
          text: props.type,
          href: `#components/${props.type}`
        },
      ]}
      ariaLabel="Breadcrumbs"
      onFollow={handleFollow}
    />
  );
}

export default Breadcrumbs;
