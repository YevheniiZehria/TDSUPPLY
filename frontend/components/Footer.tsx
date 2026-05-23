'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { fetchSiteSettings, type SiteSettings } from '@/lib/api';

interface FooterProps {
  lang: 'ro' | 'en';
}

const t = {
  ro: {
    tagline: 'Furnizor B2B premium de materiale și echipamente stomatologice. Calitate certificată, livrare rapidă.',
    catalog: 'Catalog',
    links_catalog: ['Implanturi Dentare', 'Componente Protetice', 'Instrumente Chirurgicale', 'Materiale Estetice', 'Sterilizare'],
    company: 'Companie',
    links_company: ['Despre noi', 'Parteneri', 'Calitate & Certificări', 'Blog stomatologic'],
    support: 'Suport',
    links_support: ['Cum să comand', 'Livrare & Retur', 'Garanție', 'Contact'],
    contact: 'Contact',
    address: 'Str. Medicilor 12, București, România',
    phone: '(+4) 0330 111 222',
    email: 'dentaltdsupply@gmail.com',
    program: 'L-V: 09:00 – 18:00',
    copy: '© 2026 TD Supply. Toate drepturile rezervate.',
    legal: ['Termeni și condiții', 'Politica de confidențialitate', 'Cookie-uri'],
  },
  en: {
    tagline: 'Premium B2B supplier of dental materials and equipment. Certified quality, fast delivery.',
    catalog: 'Catalog',
    links_catalog: ['Dental Implants', 'Prosthetic Components', 'Surgical Instruments', 'Aesthetic Materials', 'Sterilization'],
    company: 'Company',
    links_company: ['About us', 'Partners', 'Quality & Certifications', 'Dental Blog'],
    support: 'Support',
    links_support: ['How to order', 'Shipping & Returns', 'Warranty', 'Contact'],
    contact: 'Contact',
    address: '12 Medicilor St., Bucharest, Romania',
    phone: '(+4) 0330 111 222',
    email: 'dentaltdsupply@gmail.com',
    program: 'Mon-Fri: 09:00 – 18:00',
    copy: '© 2026 TD Supply. All rights reserved.',
    legal: ['Terms & Conditions', 'Privacy Policy', 'Cookies'],
  },
};

const catSlugs = ['implanturi', 'componente-protetice', 'instrumente', 'estetica-dentara', 'protectie-sterilizare'];

export default function Footer({ lang }: FooterProps) {
  const txt = t[lang];
  const [settings, setSettings] = useState<SiteSettings | null>(null);

  useEffect(() => {
    fetchSiteSettings()
      .then(setSettings)
      .catch(() => {});
  }, []);

  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-grid">
          {/* Brand */}
          <div className="footer-brand">
            <img src="/logo-td-supply.png" alt="TD Supply" className="footer-logo" />
            <p className="footer-tagline">{txt.tagline}</p>
          </div>

          {/* Catalog */}
          <div>
            <div className="footer-col-title">{txt.catalog}</div>
            <ul className="footer-links">
              {txt.links_catalog.map((link, i) => (
                <li key={i}>
                  <Link href={`/catalog?cat=${catSlugs[i]}`}>{link}</Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div>
            <div className="footer-col-title">{txt.company}</div>
            <ul className="footer-links">
              {txt.links_company.map((link, i) => (
                <li key={i}><a href="#">{link}</a></li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <div className="footer-col-title">{txt.contact}</div>
            <div className="footer-contact-item">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/>
                <circle cx="12" cy="10" r="3"/>
              </svg>
              <span>{settings?.address ?? txt.address}</span>
            </div>
            <div className="footer-contact-item">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.8 19.79 19.79 0 01.77 1.22 2 2 0 012.76 0h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.91 7.73a16 16 0 006.29 6.29l1.09-1.09a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z"/>
              </svg>
              <a href={`tel:${settings?.phone ?? txt.phone}`}>{settings?.phone ?? txt.phone}</a>
            </div>
            <div className="footer-contact-item">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                <polyline points="22,6 12,13 2,6"/>
              </svg>
              <a href={`mailto:${settings?.email ?? txt.email}`}>{settings?.email ?? txt.email}</a>
            </div>
            <div className="footer-contact-item">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/>
                <polyline points="12 6 12 12 16 14"/>
              </svg>
              <span>{settings?.workingHours ?? txt.program}</span>
            </div>
          </div>
        </div>

        <div className="footer-bottom">
          <span className="footer-copy">{txt.copy}</span>
          <div className="footer-legal">
            {txt.legal.map((l, i) => (
              <a key={i} href="#">{l}</a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
