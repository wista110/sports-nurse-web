import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { ThreadView } from "@/components/messaging/thread-view";

interface ThreadPageProps {
  params: {
    threadId: string;
  };
}

export default async function ThreadPage({ params }: ThreadPageProps) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/auth/signin");
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <ThreadView threadId={params.threadId} />
      </div>
    </div>
  );
}