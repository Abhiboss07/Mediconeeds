import SiteChrome from "@/components/SiteChrome";
import { PolicyPage } from "@/components/ui";
export const metadata = { title: "Terms of Use" };
export default function Page(){return <SiteChrome content={<PolicyPage title="Terms of Use"
 intro="By using the Mediconeeds storefront you agree to these terms."
 sections={[
  {h:"Use of the Site",p:["You agree to use the site lawfully and not to misuse content, pricing or product information."]},
  {h:"Products & Pricing",p:["All products are dermatologist-formulated by Dr Awish. Prices and availability may change without notice. Product images are representative."]},
  {h:"Skincare Disclaimer",p:["Our products support healthy skin but are not a substitute for professional medical advice. Patch test before first use; discontinue if irritation occurs."]},
  {h:"Orders",p:["We reserve the right to accept or decline any order. Order confirmation is subject to stock and verification."]},
  {h:"Intellectual Property",p:["All branding, content and imagery belong to Mediconeeds / Dr Awish Clinic and may not be reused without permission."]},
 ]}/>} />;}
