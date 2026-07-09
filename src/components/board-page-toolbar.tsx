import { ReactNode } from "react";
import { PageHeader } from "@/components/ui";

export function BoardPageToolbar({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children?: ReactNode;
}) {
  return (
    <PageHeader title={title} description={description}>
      {children}
    </PageHeader>
  );
}
