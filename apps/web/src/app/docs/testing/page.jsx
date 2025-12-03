export default function TestingDocsPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-semibold mb-4">
        Blunari – Smoke Tests & Manual QA
      </h1>
      <p className="text-sm text-gray-600 mb-6">
        This page outlines lightweight automated checks and a manual QA flow to
        verify core features.
      </p>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-2">
          1) Automated Smoke Tests (server-side)
        </h2>
        <p className="mb-2">
          We provide a server route that runs a basic smoke test suite and
          returns a JSON report.
        </p>
        <ul className="list-disc ml-6 mb-2">
          <li>
            Endpoint: <code>/api/smoke</code>
          </li>
          <li>
            Checks public pages: <code>/</code>, <code>/restaurants</code>,{" "}
            <code>/trails</code>, <code>/feed</code>
          </li>
          <li>
            Checks public APIs: <code>/api/drops/today</code>,{" "}
            <code>/api/videos/feed</code>
          </li>
          <li>
            Checks personalized API: <code>/api/passport</code> (passes if
            caller is signed-in; otherwise marked as skipped)
          </li>
        </ul>
        <p className="mb-2">Example:</p>
        <pre className="bg-gray-100 p-3 rounded text-xs overflow-auto">
          curl -sS "/api/smoke"
        </pre>
        <p className="text-sm text-gray-600">
          Tip: run from a signed-in browser session to include{" "}
          <code>/api/passport</code> as a passing check.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-2">2) Manual QA Checklist</h2>
        <p className="mb-2">
          Follow these steps end-to-end. Use two different browsers or profiles
          when needed (one for inviter, one for new user).
        </p>
        <div className="space-y-4">
          <div>
            <h3 className="font-semibold mb-1">A. Accounts & Passport</h3>
            <ol className="list-decimal ml-6 space-y-1">
              <li>Create a new account (email/password or Google)</li>
              <li>
                Visit <code>/passport</code> – expect empty friendly state and
                brief skeletons
              </li>
            </ol>
          </div>
          <div>
            <h3 className="font-semibold mb-1">B. Restaurants</h3>
            <ol className="list-decimal ml-6 space-y-1">
              <li>
                Go to <code>/restaurants</code> – list or deliberate empty
                message
              </li>
              <li>Open a restaurant detail</li>
              <li>Save it – expect short success toast</li>
              <li>Mark visited – expect "+10 XP" toast; possibly "Level up"</li>
              <li>
                Return to <code>/passport</code> – XP +10; stamps +1
              </li>
            </ol>
          </div>
          <div>
            <h3 className="font-semibold mb-1">C. Trails</h3>
            <ol className="list-decimal ml-6 space-y-1">
              <li>
                Open a trail at <code>/trails</code>
              </li>
              <li>Complete a step – progress increases, success toast</li>
              <li>Complete all steps – "+50 XP" and badge (if configured)</li>
            </ol>
          </div>
          <div>
            <h3 className="font-semibold mb-1">D. Daily Drops</h3>
            <ol className="list-decimal ml-6 space-y-1">
              <li>
                On <code>/</code>, see Today’s Drop (if active) with
                countdown/slots
              </li>
              <li>Claim once – success toast; slots decrease</li>
              <li>
                See it listed in <code>/drops/my-claims</code>
              </li>
            </ol>
          </div>
          <div>
            <h3 className="font-semibold mb-1">E. Video Feed</h3>
            <ol className="list-decimal ml-6 space-y-1">
              <li>
                Visit <code>/feed</code> – skeleton, then one video per screen;
                only visible video plays
              </li>
              <li>Like a video – toggles with toast; error toast on failure</li>
              <li>Save restaurant – success toast; toggle back</li>
              <li>Mark visited – XP/badges pipeline toasts</li>
              <li>Share link – Web Share or copy with toast</li>
            </ol>
          </div>
          <div>
            <h3 className="font-semibold mb-1">F. Referrals</h3>
            <ol className="list-decimal ml-6 space-y-1">
              <li>
                As User A, go to <code>/invite</code>; copy link and note{" "}
                <code>referral_signup_count</code>
              </li>
              <li>As User B in another browser, open the link and sign up</li>
              <li>
                Back as User A, <code>/invite</code> shows increased signups; XP
                +20
              </li>
            </ol>
          </div>
          <div>
            <h3 className="font-semibold mb-1">G. Admin (as admin)</h3>
            <ol className="list-decimal ml-6 space-y-1">
              <li>
                Visit <code>/admin</code> – should load; non-admin sees 403
              </li>
              <li>Create & publish a restaurant</li>
              <li>Create a drop</li>
              <li>Create a trail and steps; publish</li>
              <li>Approve/publish a video</li>
            </ol>
          </div>
        </div>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-2">3) Test Users & Access</h2>
        <ul className="list-disc ml-6 space-y-1">
          <li>
            Admin user: ensure one account has role <code>admin</code> for{" "}
            <code>/admin</code> access.
          </li>
          <li>
            Regular user: create a normal test account for end-to-end flows.
          </li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-2">4) Troubleshooting Notes</h2>
        <ul className="list-disc ml-6 space-y-1">
          <li>
            Today’s Drop missing? Ensure a published, active drop with capacity.
          </li>
          <li>
            Empty feed? Ensure published videos tied to published restaurants.
          </li>
          <li>
            <code>/api/passport</code> 401? You’re not signed in (expected).
          </li>
          <li>
            Duplicate claims? Prevented by uniqueness; only one claim per
            user/drop.
          </li>
          <li>
            XP delays? Refresh <code>/passport</code> and review server logs.
          </li>
        </ul>
      </section>

      <section className="mb-12">
        <h2 className="text-xl font-semibold mb-2">
          5) Out of Scope for Smoke Tests
        </h2>
        <ul className="list-disc ml-6 space-y-1">
          <li>Visual regressions</li>
          <li>Deep pagination/filter combinations</li>
          <li>Admin CRUD details (covered by manual QA)</li>
        </ul>
      </section>
    </div>
  );
}
