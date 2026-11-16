/**
 * Root of the landing page. Fonts and the saved theme are applied on <html>
 * by the root layout, shared with the rest of the product.
 */
export default function LandingRoot({ children }: { children: React.ReactNode }) {
  return (
    <div id="landing-root" className="landing">
      {children}
    </div>
  )
}
