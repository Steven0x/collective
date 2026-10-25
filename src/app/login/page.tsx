import { Window } from "@/components/ui";
import LoginForm from "./LoginForm";

export const metadata = { title: "Login — COLLECTIVE" };

export default async function Login({ searchParams }: { searchParams: Promise<{ next?: string; sent?: string }> }) {
  const { next, sent } = await searchParams;
  return (
    <div className="mx-auto max-w-md px-4 py-24">
      <h1 className="display text-5xl mb-6">SIGN IN<span className="text-magenta">_</span></h1>
      <Window title="AUTH // MAGIC LINK" right="NO PASSWORD">
        {sent ? (
          <p className="mono text-green">CHECK YOUR EMAIL. THE LINK SIGNS YOU IN ON THIS DEVICE.</p>
        ) : (
          <LoginForm next={next ?? "/me"} />
        )}
      </Window>
      <p className="mono text-muted mt-4">ONE ACCOUNT. COLLECTOR BY DEFAULT. BECOME AN ARTIST FROM YOUR ACCOUNT PAGE.</p>
    </div>
  );
}
