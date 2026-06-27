/**
 * Projects Stacking Cards Component
 * Written in plain React.createElement — no JSX, no Babel required.
 * Loaded as a native ES module directly in the browser.
 */

import React, { useRef } from "https://esm.sh/react@18";
import ReactDOM from "https://esm.sh/react-dom@18/client";
import {
  motion,
  useScroll,
  useTransform,
} from "https://esm.sh/framer-motion@10";

const e = React.createElement;

// 1. 更新了全部的 PNG 图片后缀
// 2. 精准提取了你 4 个 YouTube 视频的真实 ID
const projects = [
  {
    id: "01",
    title: "IL MONDO INOSSERVATO",
    category: "CO-OP GAME DESIGN",
    img: "./assets/cover1.png",           
    detailImg: "./assets/effect1.png",    
    videoId: "o0x57874wdo", // 提取自第一个视频
    desc: "\"IL MONDO INOSSERVATO\" è un gioco cooperativo per due giocatori che simula la vita quotidiana delle persone con disabilità visive e uditive. I due giocatori assumeranno rispettivamente il ruolo di una persona non udente e di una non vedente, collaborando per risolvere enigmi e fuggire dalla stanza. Ci auguriamo che, attraverso questo gioco, un maggior numero di persone presti attenzione alle persone con disabilità, arrivando a comprenderle e a sostenerle.",
    tech: ["Unity", "C#", "Game Design", "Accessibility"],
    github: "#",
    demo: "#"
  },
  {
    id: "02",
    title: "L'Ultimo Rintocco",
    category: "INSTALLAZIONE INTERATTIVA",
    img: "./assets/cover2.png",
    detailImg: "./assets/effect2.png",
    videoId: "qK28T7BfMJE", // 提取自第二个视频
    desc: "Riflessioni sull'innalzamento del livello del mare a Venezia attraverso la risonanza micro-fisica. Il fenomeno macroscopico del livello del mare si traduce in una micro-risonanza idrica. Una visualizzazione interattiva sulla fragile coesistenza tra uomo, natura e tecnologia.",
    tech: ["Arduino", "Sensori", "Prototipazione Hardware", "Visualizzazione"],
    github: "#",
    demo: "#"
  },
  {
    id: "03",
    title: "MICRO-CHEF",
    category: "WEB & CREATIVE CODING",
    img: "./assets/cover3.png",
    detailImg: "./assets/effect3.png",
    videoId: "6fZChocoO8c", // 提取自第三个视频
    desc: "MICRO-CHEF è un'esperienza web interattiva collegata a una stampante termica. Gli utenti salvano insetti alpini a rischio assemblando un \"bento box\" digitale con le piante corrette. Completata la missione, il sistema stampa un vero scontrino con QR code, trasformando l'esplorazione virtuale in un ricordo fisico.",
    tech: ["JavaScript", "Integrazione Hardware", "UI/UX Design", "Figma"],
    github: "#",
    demo: "#"
  },
  {
    id: "04",
    title: "FANTASY-SCI-FI ARPG",
    category: "UNREAL ENGINE 5 & 3D",
    img: "./assets/cover4.png",
    detailImg: "./assets/effect4.png",
    videoId: "A452QFLGVfw", // 提取自第四个视频
    desc: "Questo è un gioco di ruolo d'azione fantasy-fantascientifico sviluppato con Unreal Engine 5. In un mondo dilaniato da distorsioni temporali, regni medievali, città futuristiche e civiltà magiche perdute sono costrette a coesistere, scontrarsi e fondersi. I giocatori vestiranno i panni di un \"sintonizzatore\" meccanico creato appositamente per mediare le guerre, utilizzando un'energia unica, lo \"scheletro temporale\", per sfruttare la tecnologia e la magia, mantenere l'equilibrio nel caos e sedare i disordini grazie alle proprie abilità.",
    tech: ["Unreal Engine 5", "Modellazione 3D", "Game Design", "C++"],
    github: "#",
    demo: "#"
  },
  {
    id: "05",
    title: "La Tavolozza di Barnum",
    category: "ESPERIMENTO INTERATTIVO",
    img: "./assets/cover5.png",
    detailImg: "./assets/effect5.png",
    videoId: "", // 第五个没有视频，留空
    desc: "Tradurre il principio psicologico dell'effetto Barnum in un \"esperimento di mescolanza dinamica dei colori\", rivelando attraverso un'esperienza interattiva apparentemente personalizzata il riscontro universale dell'uomo verso le descrizioni vaghe.",
    tech: ["Creative Coding", "Psicologia", "Interaction Design"],
    github: "#",
    demo: "#"
  }
];

/* ── Card Component ──────────────────────────────────────── */
const Card = ({
  projectData,
  index,
  totalCards,
  sectionProgress,
}) => {
  const { id, title, category, img, desc, tech } = projectData;
  
  const targetScale = 1 - (totalCards - 1 - index) * 0.05;
  const start = index / totalCards;
  const end = (index + 1) / totalCards;
  const scale = useTransform(sectionProgress, [start, end], [1, targetScale]);

  const handleImageError = (ev) => {
    ev.target.style.display = "none";
    if (ev.target.nextSibling) {
      ev.target.nextSibling.style.display = "flex";
    }
  };

  return e(
    "div",
    {
      className: "card-sticky-container",
      style: { top: `calc(24px + ${index * 28}px)`, zIndex: index + 1 },
    },
    e(
      motion.div,
      { 
        className: "react-project-card", 
        style: { scale, cursor: "pointer" },
        // 点击卡片呼出弹窗
        onClick: () => {
          if (window.openProjectDetails) {
            window.openProjectDetails(projectData);
          }
        }
      },

      /* Top Row */
      e(
        "div",
        { className: "card-top-row" },
        e(
          "div",
          { className: "card-top-left" },
          e("span", { className: "card-num" }, id),
          e("span", { className: "card-category-tag" }, category),
          e("h3", { className: "card-project-name" }, title)
        )
      ),

      /* Bottom Row */
      e(
        "div",
        { className: "card-bottom-row" },

        /* Left column — screenshot */
        e(
          "div",
          { className: "card-left-col" },
          e(
            "div",
            { className: "card-img-wrap" },
            e("img", {
              src: img,
              alt: title,
              className: "card-screenshot",
              onError: handleImageError,
            }),
            e("div", {
              className: "card-fallback-img",
              style: {
                display: "none",
                width: "100%",
                height: "100%",
                background: "var(--proj-img-wrap-bg)",
                alignItems: "center",
                justifyContent: "center",
                flexDirection: "column",
                color: "var(--proj-muted)",
              },
            },
              e("span", {
                style: {
                  fontSize: "4.5rem",
                  fontWeight: 800,
                  fontFamily: "var(--mono)",
                  opacity: 0.15,
                  lineHeight: 1,
                },
              }, id),
              e("span", {
                style: {
                  fontSize: "1.25rem",
                  fontFamily: "var(--sans)",
                  marginTop: "0.5rem",
                  fontWeight: 700,
                  color: "var(--proj-muted)",
                },
              }, title)
            )
          )
        ),

        /* Right column — details */
        e(
          "div",
          { className: "card-right-col" },
          e("p", { 
            className: "card-desc", 
            style: { lineHeight: "1.7", color: "var(--proj-muted)", marginBottom: "1.5rem" } 
          }, desc),
          
          e(
            "div",
            { className: "card-tech-section" },
            e(
              "div",
              { className: "card-tech-pills" },
              ...tech.map((pill, idx) =>
                e("span", { key: idx, className: "card-tech-pill" }, pill)
              )
            )
          ),
          
          e("div", { className: "card-actions", style: { marginTop: "auto", paddingTop: "1rem" } }, 
            e("span", {
              className: "action-btn",
              style: { pointerEvents: "none" } 
            }, "[ ESPLORA I DETTAGLI ]")
          )
        )
      )
    )
  );
};

/* ── ProjectsSection Component ───────────────────────────── */
const ProjectsSection = () => {
  const sectionRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end end"],
  });

  return e(
    "div",
    { ref: sectionRef, className: "react-projects-inner" },

    /* Title block */
    e(
      "div",
      { className: "react-projects-title-wrap" },
      e("p", { className: "react-projects-pre" }, "////// ESPLORANDO IL LABORATORIO"),
      e("h2", { className: "react-projects-title" }, "Progetti")
    ),

    /* Stacking cards */
    e(
      "div",
      { className: "sticky-cards-stack" },
      ...projects.map((project, index) =>
        e(Card, {
          key: project.id,
          projectData: project, 
          index,
          totalCards: projects.length,
          sectionProgress: scrollYProgress,
        })
      )
    )
  );
};

/* ── Mount ───────────────────────────────────────────────── */
const container = document.getElementById("react-projects-root");
if (container) {
  const root = ReactDOM.createRoot(container);
  root.render(e(React.StrictMode, null, e(ProjectsSection, null)));
}