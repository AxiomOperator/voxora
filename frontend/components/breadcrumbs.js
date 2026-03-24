"use client";
import { Anchor, Breadcrumbs as MantineBreadcrumbs, Text } from "@mantine/core";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Breadcrumbs() {
  const pathname = usePathname();
  const segments = pathname.split("/").filter(Boolean);

  if (segments.length === 0) return null;

  const crumbs = [
    { label: "Home", href: "/" },
    ...segments.map((seg, i) => ({
      label: seg.charAt(0).toUpperCase() + seg.slice(1),
      href: `/${segments.slice(0, i + 1).join("/")}`,
    })),
  ];

  return (
    <MantineBreadcrumbs mb="md">
      {crumbs.map((crumb, i) =>
        i < crumbs.length - 1
          ? <Anchor
              component={Link}
              href={crumb.href}
              size="sm"
              key={crumb.href}
            >
              {crumb.label}
            </Anchor>
          : <Text size="sm" key={crumb.href}>
              {crumb.label}
            </Text>,
      )}
    </MantineBreadcrumbs>
  );
}
