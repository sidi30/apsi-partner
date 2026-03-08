import { useState, useEffect, useCallback } from "react";
import { useTheme } from "@/hooks/use-theme";
import { Button } from "@/components/ui/button";
import {
  Shield, Search, Bug, Lock, Eye, Server, FileCode, Scale,
  Terminal, ChevronRight, CheckCircle, XCircle, Award,
  RotateCcw, Zap, Database, Globe, Wifi, HardDrive,
  AlertTriangle, BookOpen, Target, Layers, ArrowRight,
  Clock, DollarSign, Users, Cpu, Network,
} from "lucide-react";

/* ─── TYPES ─── */
interface CyberDomain {
  id: string;
  name: string;
  icon: typeof Shield;
  color: string;
  shortDesc: string;
  fullDesc: string;
  realWorldExample: string;
  salary: string;
  keySkills: string[];
}

interface QuizQuestion {
  id: string;
  domain: string;
  question: string;
  options: string[];
  correct: number;
  explanation: string;
  difficulty: "debutant" | "intermediaire" | "avance";
}

interface CyberTool {
  name: string;
  domain: string;
  description: string;
  usage: string;
  free: boolean;
  popularity: number; // 1-5
}

interface SimulationStep {
  title: string;
  description: string;
  action: string;
  result: string;
  tool?: string;
}

interface Simulation {
  id: string;
  title: string;
  icon: typeof Shield;
  color: string;
  context: string;
  steps: SimulationStep[];
  budget?: string;
}

/* ─── DATA ─── */
const DOMAINS: CyberDomain[] = [
  {
    id: "pentest",
    name: "Pentest / Red Team",
    icon: Bug,
    color: "#EF4444",
    shortDesc: "Tester la securite en simulant des attaques",
    fullDesc: "Le pentesting consiste a tester les systemes informatiques en simulant des cyberattaques reelles. Le but est de trouver les failles AVANT les vrais hackers. Le Red Team va plus loin : il simule un adversaire persistant sur plusieurs semaines, testant aussi l'ingenierie sociale et la securite physique.",
    realWorldExample: "Un pentester est engage par une banque. Il decouvre qu'un serveur web utilise une version obsolete d'Apache avec une faille connue (CVE). Il exploite cette faille, accede au reseau interne, et remonte jusqu'a la base de donnees clients. Rapport : faille critique, correctif urgent.",
    salary: "45-90k EUR/an",
    keySkills: ["Reseaux TCP/IP", "Linux", "Scripting Python", "OWASP Top 10", "Methodologies (PTES, OSSTMM)"],
  },
  {
    id: "forensic",
    name: "Forensic / DFIR",
    icon: Search,
    color: "#8B5CF6",
    shortDesc: "Enqueter apres un incident de securite",
    fullDesc: "Le Forensic (Digital Forensics & Incident Response) c'est l'investigation numerique. Apres une attaque, on analyse les disques durs, la memoire RAM, les logs reseau pour comprendre CE QUI S'EST PASSE, COMMENT, et PAR QUI. C'est la police scientifique du numerique.",
    realWorldExample: "Une entreprise decouvre un ransomware un lundi matin. L'equipe DFIR analyse la timeline : le hacker est entre via un email de phishing vendredi soir, a utilise Mimikatz pour voler des credentials, puis a deploye le ransomware via GPO. L'equipe identifie le patient zero et le vecteur d'attaque.",
    salary: "50-85k EUR/an",
    keySkills: ["Analyse memoire", "Analyse disque", "Logs Windows/Linux", "Timeline analysis", "Chain of custody"],
  },
  {
    id: "soc",
    name: "SOC / Blue Team",
    icon: Eye,
    color: "#3B82F6",
    shortDesc: "Surveiller et defendre en temps reel",
    fullDesc: "Le SOC (Security Operations Center) est le centre de surveillance 24/7. Les analystes Blue Team surveillent les alertes de securite, detectent les comportements suspects, et repondent aux incidents. C'est le mur de defense permanent de l'organisation.",
    realWorldExample: "A 3h du matin, le SIEM genere une alerte : un compte admin se connecte depuis un pays inhabituel. L'analyste SOC verifie les logs, confirme que c'est un acces illegitime, isole le poste compromis, reset les credentials, et declenche la procedure d'incident.",
    salary: "35-70k EUR/an",
    keySkills: ["SIEM (Splunk, ELK)", "Detection de menaces", "Analyse de logs", "Reponse a incident", "Threat Intelligence"],
  },
  {
    id: "devsecops",
    name: "DevSecOps",
    icon: FileCode,
    color: "#10B981",
    shortDesc: "Integrer la securite dans le developpement",
    fullDesc: "Le DevSecOps integre la securite a chaque etape du cycle de developpement logiciel. Au lieu de tester la securite a la fin, on automatise les controles dans le pipeline CI/CD : analyse de code statique (SAST), analyse dynamique (DAST), scan de dependances, et Infrastructure as Code securisee.",
    realWorldExample: "Un developpeur push du code avec une dependance npm vulnerable. Le pipeline CI/CD bloque automatiquement le merge request, indiquant la CVE trouvee par Snyk. Le dev met a jour la dependance, le scan passe, et le code est deploye en securite.",
    salary: "50-95k EUR/an",
    keySkills: ["CI/CD (GitLab, Jenkins)", "Docker/Kubernetes", "SAST/DAST", "IaC (Terraform)", "Scripting"],
  },
  {
    id: "gouvernance",
    name: "Gouvernance / GRC",
    icon: Scale,
    color: "#F59E0B",
    shortDesc: "Gerer les risques et la conformite",
    fullDesc: "La Gouvernance, Risques et Conformite (GRC) definit les politiques de securite, evalue les risques, et assure la conformite aux normes (ISO 27001, RGPD, NIS2). C'est le cadre strategique qui decide OU investir en securite et COMMENT organiser la protection.",
    realWorldExample: "Un RSSI realise une analyse de risques et decouvre que 60% des employes reutilisent le meme mot de passe. Il met en place une politique de MFA obligatoire, forme le personnel, et documente le tout pour l'audit ISO 27001 prevu dans 6 mois.",
    salary: "55-100k EUR/an",
    keySkills: ["ISO 27001/27005", "EBIOS RM", "RGPD/NIS2", "Analyse de risques", "Redaction de politiques"],
  },
  {
    id: "crypto",
    name: "Cryptographie",
    icon: Lock,
    color: "#EC4899",
    shortDesc: "Proteger les donnees par le chiffrement",
    fullDesc: "La cryptographie est la science de la protection de l'information. Elle couvre le chiffrement (AES, RSA), les signatures numeriques, les certificats SSL/TLS, la blockchain, et la gestion des cles. Sans crypto, pas de commerce en ligne, pas de messagerie securisee, pas de mots de passe surs.",
    realWorldExample: "WhatsApp utilise le protocole Signal (chiffrement bout-en-bout). Chaque message est chiffre avec une cle unique (Double Ratchet). Meme si un attaquant intercepte le message, il ne peut pas le lire sans la cle privee du destinataire stockee sur son telephone.",
    salary: "55-100k EUR/an",
    keySkills: ["Algorithmes (AES, RSA, ECC)", "PKI / Certificats", "TLS/SSL", "Hash functions", "Mathematiques"],
  },
  {
    id: "osint",
    name: "OSINT",
    icon: Globe,
    color: "#06B6D4",
    shortDesc: "Renseignement en sources ouvertes",
    fullDesc: "L'OSINT (Open Source Intelligence) consiste a collecter et analyser des informations disponibles publiquement : reseaux sociaux, registres publics, DNS, moteurs de recherche, dark web. C'est utilise pour le renseignement, la veille sur les menaces, et la preparation d'audits de securite.",
    realWorldExample: "Avant un pentest, l'equipe Red Team utilise l'OSINT pour cartographier la surface d'attaque : emails des employes trouves sur LinkedIn et Hunter.io, sous-domaines decouverts via crt.sh, technologies identifiees avec Wappalyzer. Tout ca SANS toucher au reseau de la cible.",
    salary: "40-75k EUR/an",
    keySkills: ["Google Dorking", "Reseaux sociaux", "DNS / Whois", "Analyse de metadonnees", "Outils de scraping"],
  },
  {
    id: "securite-reseau",
    name: "Securite Reseau",
    icon: Network,
    color: "#F97316",
    shortDesc: "Proteger les infrastructures reseau",
    fullDesc: "La securite reseau couvre la protection des infrastructures : firewalls, IDS/IPS, segmentation reseau, VPN, Zero Trust, Wi-Fi securise. C'est la premiere ligne de defense qui controle qui entre et sort du reseau de l'organisation.",
    realWorldExample: "Un architecte reseau met en place une segmentation Zero Trust : chaque service (RH, Finance, IT) est dans un VLAN separe avec des regles de firewall strictes. Quand un poste est compromis dans le VLAN RH, l'attaquant ne peut pas pivoter vers le VLAN Finance.",
    salary: "45-80k EUR/an",
    keySkills: ["Firewalls (Palo Alto, Fortinet)", "IDS/IPS (Suricata, Snort)", "VPN / Zero Trust", "TCP/IP avance", "Segmentation VLAN"],
  },
  {
    id: "malware",
    name: "Analyse de Malware",
    icon: Cpu,
    color: "#DC2626",
    shortDesc: "Dissequer et comprendre les logiciels malveillants",
    fullDesc: "L'analyse de malware consiste a etudier les logiciels malveillants pour comprendre leur fonctionnement : comment ils infectent, ce qu'ils font, comment les detecter et les neutraliser. L'analyse statique examine le code sans l'executer, l'analyse dynamique observe le comportement en sandbox.",
    realWorldExample: "Un analyste recoit un fichier suspect. En sandbox, il observe que le malware contacte un serveur C2, exfiltre des fichiers .docx et .xlsx, et installe un keylogger. L'analyste extrait les IOCs (IP du C2, hash du fichier, cles de registre) et les partage via MISP pour proteger d'autres organisations.",
    salary: "50-90k EUR/an",
    keySkills: ["Assembleur x86/x64", "Reverse engineering", "Sandbox (Any.Run, Joe)", "YARA rules", "Analyse statique/dynamique"],
  },
  {
    id: "cloud",
    name: "Securite Cloud",
    icon: Server,
    color: "#7C3AED",
    shortDesc: "Securiser les environnements cloud",
    fullDesc: "La securite cloud protege les donnees, applications et infrastructures dans le cloud (AWS, Azure, GCP). Elle couvre la gestion des identites (IAM), le chiffrement, la conformite, la detection de misconfiguration, et la securite des conteneurs.",
    realWorldExample: "Un audit revele qu'un bucket S3 AWS est public et contient des donnees clients. L'equipe securite met en place : chiffrement SSE-S3, politique IAM restrictive, CloudTrail pour l'audit, et GuardDuty pour la detection. Ils deployent aussi un outil CSPM (Prowler) pour scanner toutes les configurations cloud.",
    salary: "55-100k EUR/an",
    keySkills: ["AWS / Azure / GCP", "IAM / Policies", "Conteneurs (Docker, K8s)", "IaC securise", "CSPM / CWPP"],
  },
];

const QUIZ_QUESTIONS: QuizQuestion[] = [
  // Pentest
  {
    id: "q1", domain: "pentest", difficulty: "debutant",
    question: "Quelle est la premiere phase d'un test de penetration ?",
    options: ["Exploitation", "Reconnaissance", "Post-exploitation", "Rapport"],
    correct: 1,
    explanation: "La reconnaissance est toujours la premiere etape. On collecte des informations sur la cible (IP, domaines, technologies, employes) AVANT d'essayer d'exploiter quoi que ce soit. Sans bonne reco, on attaque a l'aveugle.",
  },
  {
    id: "q2", domain: "pentest", difficulty: "intermediaire",
    question: "Que signifie CVE ?",
    options: ["Cyber Vulnerability Expert", "Common Vulnerabilities and Exposures", "Critical Vulnerability Exploit", "Computer Virus Encyclopedia"],
    correct: 1,
    explanation: "CVE = Common Vulnerabilities and Exposures. C'est un systeme de reference international qui attribue un identifiant unique (ex: CVE-2024-12345) a chaque faille de securite connue. Cela permet a tout le monde de parler de la meme faille sans ambiguite.",
  },
  {
    id: "q3", domain: "pentest", difficulty: "avance",
    question: "Quelle technique permet de contourner un WAF lors d'une injection SQL ?",
    options: ["Utiliser un VPN", "Encodage des payloads (hex, double URL encoding)", "Scanner plus vite", "Changer d'adresse MAC"],
    correct: 1,
    explanation: "Les WAF filtrent les patterns connus d'injection. En encodant les payloads (hex, double URL encoding, commentaires SQL inline), on peut parfois bypasser les regles de detection. Exemple : UNION SELECT -> UN/**/ION+SEL/**/ECT ou %55%4E%49%4F%4E.",
  },
  // Forensic
  {
    id: "q4", domain: "forensic", difficulty: "debutant",
    question: "Pourquoi faut-il faire une copie du disque avant analyse forensique ?",
    options: ["Pour gagner du temps", "Pour preserver l'integrite des preuves", "Pour avoir un backup", "Par habitude"],
    correct: 1,
    explanation: "En forensic, on ne travaille JAMAIS sur le disque original. Chaque action modifie des metadonnees (date d'acces, etc.). On cree un 'image forensique' bit-a-bit et on travaille sur la copie. L'original est scelle comme preuve legale.",
  },
  {
    id: "q5", domain: "forensic", difficulty: "intermediaire",
    question: "Quel artefact Windows indique les programmes recemment executes ?",
    options: ["Event Viewer", "Prefetch files", "Fichiers temp", "Cookies"],
    correct: 1,
    explanation: "Les fichiers Prefetch (C:\\Windows\\Prefetch) enregistrent chaque programme execute : nom, chemin, nombre d'executions, et timestamp de la derniere execution. C'est une mine d'or forensique pour reconstituer ce que l'attaquant a fait.",
  },
  // SOC
  {
    id: "q6", domain: "soc", difficulty: "debutant",
    question: "Qu'est-ce qu'un SIEM ?",
    options: ["Un antivirus", "Un systeme de collecte et correlation de logs de securite", "Un firewall intelligent", "Un scanner de vulnerabilites"],
    correct: 1,
    explanation: "Un SIEM (Security Information and Event Management) collecte les logs de TOUTES les sources (serveurs, firewall, endpoints, apps), les correle, et genere des alertes. C'est le cerveau du SOC. Exemples : Splunk, QRadar, ELK/SIEM, Wazuh.",
  },
  {
    id: "q7", domain: "soc", difficulty: "intermediaire",
    question: "Que signifie un 'faux positif' dans un SOC ?",
    options: ["Une vraie attaque non detectee", "Une alerte declenchee pour un evenement legitime", "Un log corrompu", "Un malware cache"],
    correct: 1,
    explanation: "Un faux positif est une alerte qui se declenche alors qu'il n'y a PAS de menace reelle. Ex: un admin qui scanne le reseau declenche l'IDS. Les faux positifs sont le cauchemar des SOC car ils noient les vraies alertes. Un bon SOC les reduit par le tuning des regles.",
  },
  // DevSecOps
  {
    id: "q8", domain: "devsecops", difficulty: "debutant",
    question: "Que fait un outil SAST ?",
    options: ["Scanne le reseau", "Analyse le code source pour trouver des failles", "Teste les performances", "Gere les deploiements"],
    correct: 1,
    explanation: "SAST = Static Application Security Testing. L'outil analyse le code SOURCE (sans l'executer) pour trouver des vulnerabilites : injection SQL, XSS, secrets en dur, etc. Il s'integre dans le pipeline CI/CD pour bloquer le code vulnerable avant la production.",
  },
  {
    id: "q9", domain: "devsecops", difficulty: "intermediaire",
    question: "Quelle est la difference entre SAST et DAST ?",
    options: ["SAST est gratuit, DAST est payant", "SAST analyse le code, DAST teste l'app en cours d'execution", "SAST est plus recent que DAST", "Il n'y a pas de difference"],
    correct: 1,
    explanation: "SAST analyse le code source (boite blanche) : rapide, trouve les failles tot, mais genere des faux positifs. DAST teste l'application deployee (boite noire) : simule un attaquant reel, trouve les failles runtime, mais plus tard dans le cycle. Les deux sont complementaires !",
  },
  // GRC
  {
    id: "q10", domain: "gouvernance", difficulty: "debutant",
    question: "Que signifie RGPD ?",
    options: ["Reglement General de Protection des Donnees", "Regle Globale de Prevention Digitale", "Reglement de Gestion des Plateformes Digitales", "Reference Generale de la Protection des Donnees"],
    correct: 0,
    explanation: "Le RGPD (Reglement General sur la Protection des Donnees) est la loi europeenne qui protege les donnees personnelles des citoyens. Elle impose le consentement, le droit a l'oubli, la notification de breaches en 72h, et des amendes jusqu'a 4% du CA mondial.",
  },
  {
    id: "q11", domain: "gouvernance", difficulty: "intermediaire",
    question: "Dans une analyse de risques, que represente l'equation Risque = ?",
    options: ["Cout x Temps", "Menace x Vulnerabilite x Impact", "Probabilite x Budget", "Nombre d'attaques x Degats"],
    correct: 1,
    explanation: "Risque = Menace x Vulnerabilite x Impact. Une menace exploite une vulnerabilite pour causer un impact. Si l'un des trois est nul, le risque est nul. C'est la base de toute methodologie d'analyse de risques (EBIOS RM, ISO 27005, etc.).",
  },
  // Crypto
  {
    id: "q12", domain: "crypto", difficulty: "debutant",
    question: "Quelle est la difference entre chiffrement symetrique et asymetrique ?",
    options: ["Symetrique est plus ancien", "Symetrique utilise 1 cle, asymetrique utilise 2 cles (publique/privee)", "Asymetrique est plus rapide", "Il n'y a pas de difference"],
    correct: 1,
    explanation: "Symetrique (AES) : 1 seule cle pour chiffrer ET dechiffrer - rapide mais il faut partager la cle en securite. Asymetrique (RSA) : 1 cle publique pour chiffrer + 1 cle privee pour dechiffrer - plus lent mais resout le probleme du partage de cle. En pratique, on combine les deux (TLS).",
  },
  {
    id: "q13", domain: "crypto", difficulty: "avance",
    question: "Pourquoi SHA-256 n'est PAS un algorithme de chiffrement ?",
    options: ["Il est trop vieux", "C'est un hash : irreversible, il ne permet pas de retrouver le message original", "Il est trop lent", "Il n'est pas standardise"],
    correct: 1,
    explanation: "SHA-256 est une fonction de HACHAGE, pas de chiffrement. Un hash est a sens unique : on peut calculer le hash d'un message, mais on ne peut PAS retrouver le message a partir du hash. C'est utilise pour verifier l'integrite (mot de passe, signature), pas pour cacher de l'information.",
  },
  // OSINT
  {
    id: "q14", domain: "osint", difficulty: "debutant",
    question: "Qu'est-ce que le 'Google Dorking' ?",
    options: ["Un virus Google", "L'utilisation d'operateurs de recherche avances pour trouver des infos sensibles", "Un outil de hacking", "Le piratage de Google"],
    correct: 1,
    explanation: "Le Google Dorking utilise des operateurs de recherche avances (site:, filetype:, intitle:, inurl:) pour trouver des informations sensibles indexees par erreur. Ex: 'filetype:pdf site:example.com confidentiel' peut reveler des documents internes. C'est legal mais puissant.",
  },
  // Reseau
  {
    id: "q15", domain: "securite-reseau", difficulty: "debutant",
    question: "Que fait un firewall ?",
    options: ["Chiffre les donnees", "Filtre le trafic reseau selon des regles", "Detecte les virus", "Accelere le reseau"],
    correct: 1,
    explanation: "Un firewall filtre le trafic reseau entrant et sortant selon des regles definies (IP source/destination, port, protocole). C'est comme un videur : il decide qui entre et qui sort. Il existe des firewalls reseau (Palo Alto, Fortinet) et des firewalls applicatifs (WAF).",
  },
  {
    id: "q16", domain: "securite-reseau", difficulty: "intermediaire",
    question: "Quelle est la difference entre un IDS et un IPS ?",
    options: ["IDS est plus cher", "IDS detecte et alerte, IPS detecte ET bloque", "IPS est un IDS plus ancien", "Il n'y a pas de difference"],
    correct: 1,
    explanation: "IDS (Intrusion Detection System) : detecte les activites suspectes et genere une alerte. Il observe passivement. IPS (Intrusion Prevention System) : detecte ET bloque automatiquement le trafic malveillant. C'est un IDS avec le pouvoir d'agir. Risque IPS : bloquer du trafic legitime (faux positif).",
  },
  // Malware
  {
    id: "q17", domain: "malware", difficulty: "debutant",
    question: "Quelle est la difference entre un virus et un ver (worm) ?",
    options: ["Le virus est plus dangereux", "Un virus a besoin d'un hote pour se propager, un ver se propage seul sur le reseau", "Le ver est une version amelioree du virus", "Il n'y a pas de difference"],
    correct: 1,
    explanation: "Un virus doit s'attacher a un fichier/programme pour se propager (il a besoin d'une action humaine). Un ver (worm) se propage SEUL sur le reseau en exploitant des vulnerabilites - pas besoin d'intervention humaine. Ex celebre: WannaCry (2017) etait un ver qui a infecte 230 000 machines en quelques heures.",
  },
  // Cloud
  {
    id: "q18", domain: "cloud", difficulty: "debutant",
    question: "Quel est le risque #1 en securite cloud ?",
    options: ["Le cloud est piratable facilement", "Les mauvaises configurations (misconfigurations)", "Le manque de chiffrement", "Les pannes serveur"],
    correct: 1,
    explanation: "Les misconfigurations sont la cause #1 des incidents cloud : buckets S3 publics, security groups trop permissifs, IAM sans MFA, etc. Le cloud est securise PAR DEFAUT par le provider, mais c'est le client qui introduit les failles en configurant mal ses ressources (modele de responsabilite partagee).",
  },
];

const TOOLS: CyberTool[] = [
  // Pentest
  { name: "Nmap", domain: "pentest", description: "Scanner de ports et services reseau", usage: "nmap -sV -sC target.com", free: true, popularity: 5 },
  { name: "Burp Suite", domain: "pentest", description: "Proxy d'interception pour tester les apps web", usage: "Intercepter et modifier les requetes HTTP en temps reel", free: false, popularity: 5 },
  { name: "Metasploit", domain: "pentest", description: "Framework d'exploitation avec +2000 exploits", usage: "msfconsole > use exploit/... > set RHOSTS > run", free: true, popularity: 5 },
  { name: "SQLmap", domain: "pentest", description: "Detection et exploitation automatique d'injections SQL", usage: "sqlmap -u 'url?id=1' --dbs", free: true, popularity: 4 },
  { name: "Hashcat", domain: "pentest", description: "Cracking de mots de passe par GPU", usage: "hashcat -m 0 -a 0 hashes.txt wordlist.txt", free: true, popularity: 4 },
  { name: "Gobuster", domain: "pentest", description: "Brute-force de repertoires et fichiers web", usage: "gobuster dir -u http://target -w wordlist.txt", free: true, popularity: 4 },
  // Forensic
  { name: "Autopsy", domain: "forensic", description: "Plateforme d'analyse forensique de disques", usage: "Interface graphique, ajout d'image disque, analyse automatique", free: true, popularity: 5 },
  { name: "Volatility 3", domain: "forensic", description: "Analyse forensique de la memoire RAM", usage: "vol -f memory.dmp windows.pslist", free: true, popularity: 5 },
  { name: "FTK Imager", domain: "forensic", description: "Acquisition d'images forensiques de disques", usage: "Creation d'images bit-a-bit (E01, dd)", free: true, popularity: 5 },
  { name: "Wireshark", domain: "forensic", description: "Analyse de captures reseau (PCAP)", usage: "Filtres: http.request, tcp.port == 443, dns", free: true, popularity: 5 },
  { name: "KAPE", domain: "forensic", description: "Collecte rapide d'artefacts forensiques", usage: "Extraction automatisee de Prefetch, MFT, registres", free: true, popularity: 4 },
  // SOC
  { name: "Splunk", domain: "soc", description: "SIEM leader - collecte et analyse de logs", usage: "index=main sourcetype=syslog | stats count by src_ip", free: false, popularity: 5 },
  { name: "Wazuh", domain: "soc", description: "SIEM/XDR open source avec detection d'intrusion", usage: "Deploiement agents + dashboard Kibana", free: true, popularity: 4 },
  { name: "TheHive", domain: "soc", description: "Plateforme de gestion d'incidents de securite", usage: "Creation de cas, observables, playbooks de reponse", free: true, popularity: 4 },
  { name: "MISP", domain: "soc", description: "Plateforme de partage d'indicateurs de compromission (IOC)", usage: "Partage d'IOCs entre organisations (IP, hash, domaines)", free: true, popularity: 4 },
  { name: "Suricata", domain: "soc", description: "IDS/IPS open source haute performance", usage: "Detection de menaces reseau en temps reel", free: true, popularity: 4 },
  // DevSecOps
  { name: "SonarQube", domain: "devsecops", description: "Analyse statique de code (qualite + securite)", usage: "Integration CI/CD, dashboard de qualite de code", free: true, popularity: 5 },
  { name: "Snyk", domain: "devsecops", description: "Scan de vulnerabilites dans les dependances", usage: "snyk test --all-projects", free: true, popularity: 5 },
  { name: "Trivy", domain: "devsecops", description: "Scanner de vulnerabilites pour conteneurs et IaC", usage: "trivy image nginx:latest", free: true, popularity: 4 },
  { name: "GitLeaks", domain: "devsecops", description: "Detection de secrets dans le code (cles API, tokens)", usage: "gitleaks detect --source .", free: true, popularity: 4 },
  { name: "OWASP ZAP", domain: "devsecops", description: "Scanner DAST gratuit pour tester les apps web", usage: "Scan automatise + exploration manuelle", free: true, popularity: 4 },
  // GRC
  { name: "EBIOS RM", domain: "gouvernance", description: "Methode francaise d'analyse de risques (ANSSI)", usage: "5 ateliers : cadrage, sources, scenarios strategiques/operationnels, traitement", free: true, popularity: 5 },
  { name: "ISO 27001", domain: "gouvernance", description: "Norme internationale de management de la securite", usage: "114 controles repartis en 14 domaines, certification par audit", free: false, popularity: 5 },
  { name: "Verinice", domain: "gouvernance", description: "Outil open source de gestion ISMS / conformite", usage: "Gestion des risques, conformite ISO 27001, catalogues", free: true, popularity: 3 },
  // OSINT
  { name: "Maltego", domain: "osint", description: "Outil de cartographie de relations et entites", usage: "Graphes de liens entre personnes, domaines, IPs", free: false, popularity: 5 },
  { name: "Shodan", domain: "osint", description: "Moteur de recherche pour appareils connectes a Internet", usage: "Recherche de serveurs, cameras IP, systemes SCADA", free: true, popularity: 5 },
  { name: "theHarvester", domain: "osint", description: "Collecte d'emails, sous-domaines, IPs", usage: "theHarvester -d target.com -b google,linkedin", free: true, popularity: 4 },
  { name: "SpiderFoot", domain: "osint", description: "Automatisation OSINT multi-sources", usage: "Scan automatise de 200+ sources de donnees", free: true, popularity: 4 },
  // Reseau
  { name: "Palo Alto NGFW", domain: "securite-reseau", description: "Firewall nouvelle generation leader du marche", usage: "Filtrage applicatif, IPS, threat prevention, URL filtering", free: false, popularity: 5 },
  { name: "Fortinet FortiGate", domain: "securite-reseau", description: "Firewall UTM/NGFW tres repandu", usage: "SD-WAN, IPS, antimalware, VPN, web filtering", free: false, popularity: 5 },
  { name: "pfSense", domain: "securite-reseau", description: "Firewall/routeur open source", usage: "Installation sur PC standard, interface web", free: true, popularity: 4 },
  { name: "Zeek (Bro)", domain: "securite-reseau", description: "Analyseur de trafic reseau pour la securite", usage: "Analyse passive du trafic, generation de logs structures", free: true, popularity: 4 },
  // Malware
  { name: "Ghidra", domain: "malware", description: "Framework de reverse engineering (NSA)", usage: "Desassemblage, decompilation, analyse de binaires", free: true, popularity: 5 },
  { name: "IDA Pro", domain: "malware", description: "Desassembleur/decompilateur professionnel", usage: "Analyse statique avancee de binaires", free: false, popularity: 5 },
  { name: "Any.Run", domain: "malware", description: "Sandbox interactive d'analyse de malware", usage: "Upload d'un fichier suspect, observation en temps reel", free: true, popularity: 4 },
  { name: "YARA", domain: "malware", description: "Regles de detection de patterns dans les fichiers", usage: "Ecriture de signatures personnalisees pour detecter des malwares", free: true, popularity: 4 },
  // Cloud
  { name: "Prowler", domain: "cloud", description: "Audit de securite AWS/Azure/GCP", usage: "prowler aws --severity critical", free: true, popularity: 4 },
  { name: "ScoutSuite", domain: "cloud", description: "Audit multi-cloud de securite", usage: "scout aws --report-dir output/", free: true, popularity: 4 },
  { name: "CloudSploit", domain: "cloud", description: "Scanner de misconfigurations cloud", usage: "Scan automatise des parametres de securite cloud", free: true, popularity: 3 },
];

const SIMULATIONS: Simulation[] = [
  {
    id: "pentest-sim",
    title: "Simulation Pentest Web",
    icon: Bug,
    color: "#EF4444",
    context: "Vous etes missionne pour tester la securite d'un site e-commerce. Le client vous a donne l'autorisation ecrite (lettre de mission signee). Le scope couvre uniquement le domaine shop.exemple.com.",
    budget: "5 000 - 15 000 EUR (5-10 jours)",
    steps: [
      {
        title: "Phase 1 : Reconnaissance passive",
        description: "Collecter un maximum d'informations SANS toucher au systeme cible.",
        action: "Lancer la reconnaissance OSINT",
        result: "Decouverts : serveur Apache 2.4.49, PHP 7.4, WordPress 5.8, plugin WooCommerce 5.5, 3 sous-domaines (admin., api., staging.), 12 emails d'employes sur LinkedIn.",
        tool: "theHarvester, Shodan, Wappalyzer",
      },
      {
        title: "Phase 2 : Scan actif",
        description: "Scanner les ports et services du serveur avec autorisation.",
        action: "Scanner les ports et services",
        result: "Ports ouverts : 22 (SSH), 80 (HTTP), 443 (HTTPS), 3306 (MySQL expose !), 8080 (Tomcat). Le MySQL est accessible depuis Internet - faille critique !",
        tool: "Nmap, Masscan",
      },
      {
        title: "Phase 3 : Scan de vulnerabilites",
        description: "Identifier les failles connues sur les services detectes.",
        action: "Lancer le scan de vulnerabilites",
        result: "CVE-2021-41773 trouvee sur Apache 2.4.49 (Path Traversal critique). Plugin WooCommerce vulnerable a une injection SQL. WordPress xmlrpc.php actif (brute-force possible).",
        tool: "Nikto, WPScan, Nuclei",
      },
      {
        title: "Phase 4 : Exploitation",
        description: "Exploiter les failles trouvees pour prouver l'impact reel.",
        action: "Exploiter la faille Apache + SQL injection",
        result: "Via CVE-2021-41773 : lecture du fichier /etc/passwd et wp-config.php (credentials DB). Via SQLi WooCommerce : extraction de 15 000 enregistrements clients (noms, emails, hash de mots de passe). Acces root obtenu via SSH avec les credentials trouvees.",
        tool: "Metasploit, SQLmap, Burp Suite",
      },
      {
        title: "Phase 5 : Post-exploitation & Rapport",
        description: "Documenter les trouvailles et fournir des recommandations.",
        action: "Generer le rapport de pentest",
        result: "Rapport avec 3 critiques, 5 hautes, 8 moyennes. Recommandations : MAJ Apache, desactiver MySQL externe, patcher WooCommerce, activer WAF, implementer MFA. Presentation au COMEX avec plan de remediation 30/60/90 jours.",
        tool: "Dradis, Report Template",
      },
    ],
  },
  {
    id: "soc-sim",
    title: "Simulation SOC : Incident Ransomware",
    icon: AlertTriangle,
    color: "#F59E0B",
    context: "Vous etes analyste SOC niveau 2. A 14h32, une alerte critique remonte sur le SIEM : comportement de chiffrement massif detecte sur un poste du service comptabilite. Le chrono commence.",
    budget: "SOC interne : 300-500k EUR/an | SOC externe (MSSP) : 5-15k EUR/mois",
    steps: [
      {
        title: "T+0min : Alerte & Triage",
        description: "Une alerte SIEM indique une activite de chiffrement massive.",
        action: "Analyser l'alerte SIEM",
        result: "Alerte : 2 000 fichiers renommes en .locked en 3 minutes sur PC-COMPTA-07. Process suspect : svchost_update.exe (hash inconnu de VirusTotal). Connexion sortante vers 185.xx.xx.xx (serveur C2 en Russie).",
        tool: "Splunk, VirusTotal",
      },
      {
        title: "T+5min : Containment immediat",
        description: "Isoler le poste compromis pour stopper la propagation.",
        action: "Isoler le poste du reseau",
        result: "Poste isole via EDR (CrowdStrike). Port switch desactive. Verification des partages reseau : 3 dossiers partages partiellement chiffres (Finance, RH, Direction). Le ransomware ne s'est PAS propage a d'autres postes grace a la segmentation reseau.",
        tool: "CrowdStrike Falcon, Switch CLI",
      },
      {
        title: "T+15min : Investigation",
        description: "Comprendre le vecteur d'infection et l'etendue des degats.",
        action: "Analyser la timeline de l'attaque",
        result: "Timeline reconstituee : 09h12 - Email de phishing recu (fausse facture PDF). 09h15 - Utilisateur ouvre la PJ, macro execute PowerShell. 09h16 - Telechargement du payload depuis le C2. 14h30 - Demarrage du chiffrement (timer de 5h pour eviter la detection sandbox).",
        tool: "Volatility, ELK, Exchange logs",
      },
      {
        title: "T+1h : Eradication & Recovery",
        description: "Supprimer la menace et restaurer les systemes.",
        action: "Eradiquer et restaurer",
        result: "Malware supprime, IOCs bloques sur firewall/proxy (IP C2, hash, domaines). Backups verifies (derniere sauvegarde : 13h, non chiffree). Restauration des fichiers en cours. Scan complet de tous les endpoints : aucune autre infection.",
        tool: "CrowdStrike, Veeam Backup, pfSense",
      },
      {
        title: "T+4h : Lessons Learned",
        description: "Tirer les lecons de l'incident pour ameliorer la securite.",
        action: "Rediger le rapport post-incident",
        result: "Actions : former les employes au phishing, bloquer les macros Office par GPO, implementer un mail gateway (Proofpoint), ajouter des regles SIEM pour detecter le chiffrement massif, tester les backups mensuellement. Cout de l'incident : ~45 000 EUR (temps d'arret + investigation). Cout EVITE en payant la rancon : 250 000 EUR.",
        tool: "TheHive, Confluence",
      },
    ],
  },
  {
    id: "grc-sim",
    title: "Simulation Gouvernance : Mise en conformite ISO 27001",
    icon: Scale,
    color: "#F59E0B",
    context: "Votre entreprise (PME de 200 employes, secteur sante) doit obtenir la certification ISO 27001 pour repondre a un appel d'offres strategique. Vous etes le RSSI en charge du projet.",
    budget: "Projet complet : 80-150k EUR (audit + mise en conformite sur 12-18 mois)",
    steps: [
      {
        title: "Mois 1-2 : Cadrage & Gap Analysis",
        description: "Evaluer l'ecart entre l'existant et les exigences ISO 27001.",
        action: "Lancer l'analyse d'ecart (Gap Analysis)",
        result: "Resultats : 35% de conformite actuelle. Manquent : politique de securite formelle, classification des donnees, gestion des incidents, PCA/PRA, audits internes. Points forts : chiffrement des laptops, antivirus a jour, sauvegardes regulieres.",
        tool: "Verinice, Excel de conformite",
      },
      {
        title: "Mois 3-4 : Analyse de risques EBIOS RM",
        description: "Identifier et evaluer les risques selon la methode ANSSI.",
        action: "Conduire les 5 ateliers EBIOS RM",
        result: "Risques critiques identifies : ransomware (impact: 500k EUR, probabilite: haute), fuite de donnees patients (amende RGPD + perte de confiance), indisponibilite du SI > 4h (perte de CA: 8k EUR/h). 23 scenarios de risques documentes, 15 mesures de securite prioritaires definies.",
        tool: "EBIOS RM, MONARC",
      },
      {
        title: "Mois 5-8 : Implementation des mesures",
        description: "Mettre en place les controles de securite manquants.",
        action: "Deployer les mesures de securite",
        result: "Deploye : SIEM Wazuh, MFA sur tous les acces, politique de mots de passe renforce, formation securite (95% des employes formes), chiffrement des donnees patients, PCA/PRA teste, gestion des incidents formalisee, revue des acces trimestrielle. 14 politiques de securite redigees et approuvees par la direction.",
        tool: "Wazuh, Azure AD, KeePass",
      },
      {
        title: "Mois 9-10 : Audit interne",
        description: "Verifier la conformite avant l'audit de certification.",
        action: "Realiser l'audit interne",
        result: "Audit interne : 12 non-conformites mineures trouvees (documentation incomplete, logs non revises regulierement, 3 comptes orphelins). 0 non-conformite majeure. Plan d'action correctif lance, toutes les NC corrigees en 6 semaines.",
        tool: "Checklist ISO 27001, Verinice",
      },
      {
        title: "Mois 12 : Audit de certification",
        description: "L'organisme certificateur realise l'audit final.",
        action: "Passer l'audit de certification",
        result: "Audit Stage 1 (documentation) : CONFORME. Audit Stage 2 (terrain, 5 jours) : 3 observations mineures, 0 non-conformite majeure. CERTIFICATION OBTENUE ! Validite 3 ans avec audits de surveillance annuels. L'entreprise remporte l'appel d'offres strategique.",
        tool: "Organisme certificateur (Bureau Veritas, AFNOR)",
      },
    ],
  },
];

/* ─── COMPONENTS ─── */
type Section = "domains" | "quiz" | "tools" | "simulations";

export function CyberLabView() {
  const { colors } = useTheme();
  const [section, setSection] = useState<Section>("domains");
  const [selectedDomain, setSelectedDomain] = useState<string | null>(null);
  // Quiz state
  const [quizDomain, setQuizDomain] = useState<string | null>(null);
  const [quizIndex, setQuizIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [score, setScore] = useState(0);
  const [quizComplete, setQuizComplete] = useState(false);
  // Simulation state
  const [activeSim, setActiveSim] = useState<string | null>(null);
  const [simStep, setSimStep] = useState(0);
  const [simRevealed, setSimRevealed] = useState(false);
  // Tools filter
  const [toolDomain, setToolDomain] = useState<string>("all");

  const sectionNav: { key: Section; label: string; icon: typeof Shield }[] = [
    { key: "domains", label: "Domaines Cyber", icon: BookOpen },
    { key: "quiz", label: "QCM / Quiz", icon: Target },
    { key: "tools", label: "Outils", icon: Terminal },
    { key: "simulations", label: "Simulations", icon: Zap },
  ];

  const cardStyle = (hover = false): React.CSSProperties => ({
    background: colors.card,
    border: `1px solid ${colors.border}`,
    borderRadius: 12,
    padding: 20,
    cursor: hover ? "pointer" : "default",
    transition: "all 0.2s",
  });

  // Reset quiz when domain changes
  const startQuiz = useCallback((domainId: string) => {
    setQuizDomain(domainId);
    setQuizIndex(0);
    setSelectedAnswer(null);
    setShowExplanation(false);
    setScore(0);
    setQuizComplete(false);
  }, []);

  const quizQuestions = quizDomain
    ? QUIZ_QUESTIONS.filter((q) => q.domain === quizDomain)
    : [];

  const handleAnswer = (idx: number) => {
    if (showExplanation) return;
    setSelectedAnswer(idx);
    setShowExplanation(true);
    if (idx === quizQuestions[quizIndex].correct) {
      setScore((s) => s + 1);
    }
  };

  const nextQuestion = () => {
    if (quizIndex + 1 >= quizQuestions.length) {
      setQuizComplete(true);
    } else {
      setQuizIndex((i) => i + 1);
      setSelectedAnswer(null);
      setShowExplanation(false);
    }
  };

  const filteredTools = toolDomain === "all"
    ? TOOLS
    : TOOLS.filter((t) => t.domain === toolDomain);

  const currentSim = SIMULATIONS.find((s) => s.id === activeSim);

  // Animated progress for simulations
  const [simProgress, setSimProgress] = useState(0);
  useEffect(() => {
    if (simRevealed) {
      setSimProgress(0);
      const timer = setInterval(() => {
        setSimProgress((p) => {
          if (p >= 100) { clearInterval(timer); return 100; }
          return p + 4;
        });
      }, 30);
      return () => clearInterval(timer);
    }
  }, [simRevealed, simStep]);

  return (
    <div style={{ maxWidth: 1100 }}>
      {/* Header */}
      <div className="flex items-center gap-3 mb-2">
        <div style={{
          background: `linear-gradient(135deg, ${colors.accent}30, ${colors.blue}30)`,
          borderRadius: 12,
          padding: 10,
        }}>
          <Shield size={26} style={{ color: colors.accent }} />
        </div>
        <div>
          <h1 className="text-xl font-bold tracking-wide" style={{ color: colors.text, margin: 0 }}>
            CyberLab
          </h1>
          <p className="text-xs mt-0.5" style={{ color: colors.muted }}>
            Apprends la cybersecurite de maniere interactive
          </p>
        </div>
      </div>

      {/* Section Navigation */}
      <div className="flex gap-2 mb-6 mt-4 flex-wrap">
        {sectionNav.map((s) => {
          const Icon = s.icon;
          const isActive = section === s.key;
          return (
            <button
              key={s.key}
              onClick={() => setSection(s.key)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-semibold cursor-pointer transition-all"
              style={{
                background: isActive ? colors.accent + "20" : colors.surface,
                color: isActive ? colors.accent : colors.muted,
                border: `1px solid ${isActive ? colors.accent + "50" : colors.border}`,
                fontFamily: "inherit",
              }}
            >
              <Icon size={15} />
              {s.label}
            </button>
          );
        })}
      </div>

      {/* ═══════════════════ DOMAINS SECTION ═══════════════════ */}
      {section === "domains" && !selectedDomain && (
        <div>
          <p className="text-sm mb-4" style={{ color: colors.muted }}>
            Clique sur un domaine pour decouvrir ce qu'il fait, un exemple concret, et les competences cles.
          </p>
          <div className="grid gap-3" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))" }}>
            {DOMAINS.map((d) => {
              const Icon = d.icon;
              return (
                <div
                  key={d.id}
                  onClick={() => setSelectedDomain(d.id)}
                  style={{
                    ...cardStyle(true),
                    borderLeft: `3px solid ${d.color}`,
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLDivElement).style.borderColor = d.color;
                    (e.currentTarget as HTMLDivElement).style.transform = "translateY(-2px)";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLDivElement).style.borderColor = colors.border;
                    (e.currentTarget as HTMLDivElement).style.borderLeftColor = d.color;
                    (e.currentTarget as HTMLDivElement).style.transform = "none";
                  }}
                >
                  <div className="flex items-center gap-3 mb-2">
                    <div style={{ background: d.color + "20", borderRadius: 8, padding: 8 }}>
                      <Icon size={20} style={{ color: d.color }} />
                    </div>
                    <div>
                      <div className="font-bold text-sm" style={{ color: colors.text }}>{d.name}</div>
                      <div className="text-xs flex items-center gap-1.5 mt-0.5" style={{ color: colors.muted }}>
                        <DollarSign size={11} /> {d.salary}
                      </div>
                    </div>
                    <ChevronRight size={16} className="ml-auto" style={{ color: colors.muted }} />
                  </div>
                  <p className="text-xs leading-relaxed" style={{ color: colors.muted }}>
                    {d.shortDesc}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Domain Detail */}
      {section === "domains" && selectedDomain && (() => {
        const d = DOMAINS.find((x) => x.id === selectedDomain)!;
        const Icon = d.icon;
        const domainTools = TOOLS.filter((t) => t.domain === d.id).slice(0, 4);
        const domainQuizCount = QUIZ_QUESTIONS.filter((q) => q.domain === d.id).length;
        return (
          <div>
            <button
              onClick={() => setSelectedDomain(null)}
              className="flex items-center gap-1.5 text-xs mb-4 cursor-pointer"
              style={{ background: "none", border: "none", color: colors.accent, fontFamily: "inherit" }}
            >
              <RotateCcw size={13} /> Retour aux domaines
            </button>
            <div style={{ ...cardStyle(), borderLeft: `4px solid ${d.color}` }}>
              <div className="flex items-center gap-3 mb-4">
                <div style={{ background: d.color + "20", borderRadius: 10, padding: 10 }}>
                  <Icon size={28} style={{ color: d.color }} />
                </div>
                <div>
                  <h2 className="text-lg font-bold" style={{ color: colors.text, margin: 0 }}>{d.name}</h2>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-xs flex items-center gap-1" style={{ color: colors.success }}>
                      <DollarSign size={12} /> {d.salary}
                    </span>
                  </div>
                </div>
              </div>

              {/* Description */}
              <div className="mb-5">
                <h3 className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: colors.accent }}>
                  C'est quoi ?
                </h3>
                <p className="text-sm leading-relaxed" style={{ color: colors.text }}>
                  {d.fullDesc}
                </p>
              </div>

              {/* Real world example */}
              <div style={{
                background: d.color + "10",
                borderRadius: 8,
                padding: 16,
                border: `1px solid ${d.color}30`,
                marginBottom: 20,
              }}>
                <h3 className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: d.color }}>
                  Exemple concret
                </h3>
                <p className="text-xs leading-relaxed" style={{ color: colors.text }}>
                  {d.realWorldExample}
                </p>
              </div>

              {/* Key Skills */}
              <div className="mb-5">
                <h3 className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: colors.accent }}>
                  Competences cles
                </h3>
                <div className="flex flex-wrap gap-2">
                  {d.keySkills.map((s) => (
                    <span key={s} className="text-xs px-3 py-1.5 rounded-full font-medium" style={{
                      background: colors.accent + "15",
                      color: colors.accent,
                      border: `1px solid ${colors.accent}30`,
                    }}>
                      {s}
                    </span>
                  ))}
                </div>
              </div>

              {/* Domain Tools Preview */}
              {domainTools.length > 0 && (
                <div className="mb-4">
                  <h3 className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: colors.accent }}>
                    Outils principaux
                  </h3>
                  <div className="grid gap-2" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))" }}>
                    {domainTools.map((t) => (
                      <div key={t.name} className="flex items-center gap-2 text-xs p-2 rounded-lg" style={{
                        background: colors.surface,
                        border: `1px solid ${colors.border}`,
                      }}>
                        <Terminal size={13} style={{ color: d.color }} />
                        <span style={{ color: colors.text, fontWeight: 600 }}>{t.name}</span>
                        {t.free && <span className="ml-auto text-[0.6rem] px-1.5 rounded" style={{ background: colors.success + "20", color: colors.success }}>Gratuit</span>}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-2 mt-4 flex-wrap">
                {domainQuizCount > 0 && (
                  <Button small variant="secondary" onClick={() => { setSection("quiz"); startQuiz(d.id); }}>
                    <Target size={14} /> Tester mes connaissances ({domainQuizCount} questions)
                  </Button>
                )}
                <Button small variant="ghost" onClick={() => { setSection("tools"); setToolDomain(d.id); }}>
                  <Terminal size={14} /> Voir tous les outils
                </Button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ═══════════════════ QUIZ SECTION ═══════════════════ */}
      {section === "quiz" && !quizDomain && (
        <div>
          <p className="text-sm mb-4" style={{ color: colors.muted }}>
            Choisis un domaine pour tester tes connaissances. Chaque reponse est suivie d'une explication detaillee.
          </p>
          <div className="grid gap-3" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))" }}>
            {DOMAINS.map((d) => {
              const Icon = d.icon;
              const qCount = QUIZ_QUESTIONS.filter((q) => q.domain === d.id).length;
              if (qCount === 0) return null;
              return (
                <div
                  key={d.id}
                  onClick={() => startQuiz(d.id)}
                  style={{
                    ...cardStyle(true),
                    borderLeft: `3px solid ${d.color}`,
                    display: "flex",
                    alignItems: "center",
                    gap: 14,
                  }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.transform = "translateY(-2px)"; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.transform = "none"; }}
                >
                  <div style={{ background: d.color + "20", borderRadius: 8, padding: 8 }}>
                    <Icon size={20} style={{ color: d.color }} />
                  </div>
                  <div className="flex-1">
                    <div className="font-bold text-sm" style={{ color: colors.text }}>{d.name}</div>
                    <div className="text-xs mt-0.5" style={{ color: colors.muted }}>{qCount} questions</div>
                  </div>
                  <ArrowRight size={16} style={{ color: colors.muted }} />
                </div>
              );
            })}
            {/* Quiz all */}
            <div
              onClick={() => startQuiz("all")}
              style={{
                ...cardStyle(true),
                borderLeft: `3px solid ${colors.accent}`,
                display: "flex",
                alignItems: "center",
                gap: 14,
                background: colors.accent + "08",
              }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.transform = "translateY(-2px)"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.transform = "none"; }}
            >
              <div style={{ background: colors.accent + "20", borderRadius: 8, padding: 8 }}>
                <Layers size={20} style={{ color: colors.accent }} />
              </div>
              <div className="flex-1">
                <div className="font-bold text-sm" style={{ color: colors.accent }}>Quiz General</div>
                <div className="text-xs mt-0.5" style={{ color: colors.muted }}>Toutes les {QUIZ_QUESTIONS.length} questions melangees</div>
              </div>
              <ArrowRight size={16} style={{ color: colors.accent }} />
            </div>
          </div>
        </div>
      )}

      {/* Active Quiz */}
      {section === "quiz" && quizDomain && !quizComplete && (() => {
        const allQ = quizDomain === "all"
          ? QUIZ_QUESTIONS
          : QUIZ_QUESTIONS.filter((q) => q.domain === quizDomain);
        const q = allQ[quizIndex];
        if (!q) return null;
        const domain = DOMAINS.find((d) => d.id === q.domain);
        const diffColors = { debutant: colors.success, intermediaire: colors.warn, avance: colors.danger };
        const diffLabels = { debutant: "Debutant", intermediaire: "Intermediaire", avance: "Avance" };
        return (
          <div>
            <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
              <button
                onClick={() => setQuizDomain(null)}
                className="flex items-center gap-1.5 text-xs cursor-pointer"
                style={{ background: "none", border: "none", color: colors.accent, fontFamily: "inherit" }}
              >
                <RotateCcw size={13} /> Changer de domaine
              </button>
              <div className="flex items-center gap-3">
                <span className="text-xs font-bold" style={{ color: colors.muted }}>
                  Question {quizIndex + 1}/{allQ.length}
                </span>
                <span className="text-xs font-bold px-2 py-0.5 rounded" style={{
                  background: colors.accent + "20", color: colors.accent,
                }}>
                  Score: {score}/{quizIndex + (showExplanation ? 1 : 0)}
                </span>
              </div>
            </div>

            {/* Progress bar */}
            <div style={{ height: 4, background: colors.surface, borderRadius: 4, marginBottom: 20 }}>
              <div style={{
                height: "100%",
                width: `${((quizIndex + (showExplanation ? 1 : 0)) / allQ.length) * 100}%`,
                background: colors.accent,
                borderRadius: 4,
                transition: "width 0.3s",
              }} />
            </div>

            <div style={cardStyle()}>
              {/* Domain & difficulty badges */}
              <div className="flex items-center gap-2 mb-4">
                {domain && (
                  <span className="text-[0.65rem] px-2 py-0.5 rounded font-semibold" style={{
                    background: domain.color + "20", color: domain.color,
                  }}>
                    {domain.name}
                  </span>
                )}
                <span className="text-[0.65rem] px-2 py-0.5 rounded font-semibold" style={{
                  background: diffColors[q.difficulty] + "20", color: diffColors[q.difficulty],
                }}>
                  {diffLabels[q.difficulty]}
                </span>
              </div>

              {/* Question */}
              <h3 className="text-sm font-bold mb-5 leading-relaxed" style={{ color: colors.text }}>
                {q.question}
              </h3>

              {/* Options */}
              <div className="flex flex-col gap-2.5">
                {q.options.map((opt, idx) => {
                  const isSelected = selectedAnswer === idx;
                  const isCorrect = idx === q.correct;
                  let optBg = colors.surface;
                  let optBorder = colors.border;
                  let optColor = colors.text;
                  if (showExplanation) {
                    if (isCorrect) { optBg = colors.success + "15"; optBorder = colors.success; optColor = colors.success; }
                    else if (isSelected && !isCorrect) { optBg = colors.danger + "15"; optBorder = colors.danger; optColor = colors.danger; }
                  } else if (isSelected) {
                    optBg = colors.accent + "15"; optBorder = colors.accent;
                  }
                  return (
                    <button
                      key={idx}
                      onClick={() => handleAnswer(idx)}
                      className="text-left text-sm px-4 py-3 rounded-lg cursor-pointer transition-all flex items-center gap-3"
                      style={{
                        background: optBg,
                        border: `1.5px solid ${optBorder}`,
                        color: optColor,
                        fontFamily: "inherit",
                        opacity: showExplanation && !isCorrect && !isSelected ? 0.5 : 1,
                      }}
                    >
                      <span className="font-bold text-xs shrink-0" style={{
                        width: 24, height: 24, borderRadius: "50%",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        background: showExplanation && isCorrect ? colors.success + "30" : (isSelected ? colors.accent + "30" : colors.border + "50"),
                      }}>
                        {showExplanation && isCorrect ? <CheckCircle size={14} /> : showExplanation && isSelected ? <XCircle size={14} /> : String.fromCharCode(65 + idx)}
                      </span>
                      {opt}
                    </button>
                  );
                })}
              </div>

              {/* Explanation */}
              {showExplanation && (
                <div style={{
                  marginTop: 20,
                  padding: 16,
                  borderRadius: 10,
                  background: selectedAnswer === q.correct ? colors.success + "10" : colors.warn + "10",
                  border: `1px solid ${selectedAnswer === q.correct ? colors.success + "30" : colors.warn + "30"}`,
                }}>
                  <div className="flex items-center gap-2 mb-2">
                    {selectedAnswer === q.correct
                      ? <CheckCircle size={16} style={{ color: colors.success }} />
                      : <AlertTriangle size={16} style={{ color: colors.warn }} />
                    }
                    <span className="font-bold text-xs" style={{
                      color: selectedAnswer === q.correct ? colors.success : colors.warn,
                    }}>
                      {selectedAnswer === q.correct ? "Bonne reponse !" : "Pas tout a fait..."}
                    </span>
                  </div>
                  <p className="text-xs leading-relaxed" style={{ color: colors.text }}>
                    {q.explanation}
                  </p>
                  <div className="mt-3 flex justify-end">
                    <Button small onClick={nextQuestion}>
                      {quizIndex + 1 >= allQ.length ? "Voir les resultats" : "Question suivante"} <ArrowRight size={14} />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        );
      })()}

      {/* Quiz Complete */}
      {section === "quiz" && quizComplete && (() => {
        const allQ = quizDomain === "all"
          ? QUIZ_QUESTIONS
          : QUIZ_QUESTIONS.filter((q) => q.domain === quizDomain);
        const pct = Math.round((score / allQ.length) * 100);
        const getMessage = () => {
          if (pct === 100) return { text: "Parfait ! Tu maitrises ce domaine !", color: colors.accent };
          if (pct >= 75) return { text: "Tres bien ! Encore quelques points a revoir.", color: colors.success };
          if (pct >= 50) return { text: "Pas mal ! Continue a apprendre, tu progresses.", color: colors.warn };
          return { text: "Continue ! Relis les explications et reessaie.", color: colors.danger };
        };
        const msg = getMessage();
        return (
          <div style={{ ...cardStyle(), textAlign: "center", padding: 40 }}>
            <Award size={48} style={{ color: msg.color, margin: "0 auto 16px" }} />
            <h2 className="text-xl font-bold mb-2" style={{ color: colors.text }}>Resultats</h2>
            <div className="text-4xl font-bold mb-2" style={{ color: msg.color }}>{pct}%</div>
            <p className="text-sm mb-1" style={{ color: colors.text }}>{score} / {allQ.length} bonnes reponses</p>
            <p className="text-sm mb-6" style={{ color: msg.color }}>{msg.text}</p>
            <div className="flex gap-2 justify-center flex-wrap">
              <Button onClick={() => startQuiz(quizDomain!)}>
                <RotateCcw size={14} /> Recommencer
              </Button>
              <Button variant="ghost" onClick={() => setQuizDomain(null)}>
                Autre domaine
              </Button>
            </div>
          </div>
        );
      })()}

      {/* ═══════════════════ TOOLS SECTION ═══════════════════ */}
      {section === "tools" && (
        <div>
          {/* Domain filter */}
          <div className="flex gap-2 mb-5 flex-wrap">
            <button
              onClick={() => setToolDomain("all")}
              className="text-xs px-3 py-1.5 rounded-full font-semibold cursor-pointer transition-all"
              style={{
                background: toolDomain === "all" ? colors.accent + "20" : colors.surface,
                color: toolDomain === "all" ? colors.accent : colors.muted,
                border: `1px solid ${toolDomain === "all" ? colors.accent + "50" : colors.border}`,
                fontFamily: "inherit",
              }}
            >
              Tous ({TOOLS.length})
            </button>
            {DOMAINS.map((d) => {
              const count = TOOLS.filter((t) => t.domain === d.id).length;
              if (count === 0) return null;
              return (
                <button
                  key={d.id}
                  onClick={() => setToolDomain(d.id)}
                  className="text-xs px-3 py-1.5 rounded-full font-semibold cursor-pointer transition-all"
                  style={{
                    background: toolDomain === d.id ? d.color + "20" : colors.surface,
                    color: toolDomain === d.id ? d.color : colors.muted,
                    border: `1px solid ${toolDomain === d.id ? d.color + "50" : colors.border}`,
                    fontFamily: "inherit",
                  }}
                >
                  {d.name.split(" ")[0]} ({count})
                </button>
              );
            })}
          </div>

          {/* Tools grid */}
          <div className="grid gap-3" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))" }}>
            {filteredTools.map((t) => {
              const domain = DOMAINS.find((d) => d.id === t.domain);
              return (
                <div key={t.name} style={cardStyle()}>
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Terminal size={16} style={{ color: domain?.color || colors.accent }} />
                      <span className="font-bold text-sm" style={{ color: colors.text }}>{t.name}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      {t.free ? (
                        <span className="text-[0.6rem] px-2 py-0.5 rounded-full font-bold" style={{
                          background: colors.success + "20", color: colors.success,
                        }}>GRATUIT</span>
                      ) : (
                        <span className="text-[0.6rem] px-2 py-0.5 rounded-full font-bold" style={{
                          background: colors.warn + "20", color: colors.warn,
                        }}>PAYANT</span>
                      )}
                    </div>
                  </div>
                  <p className="text-xs mb-2 leading-relaxed" style={{ color: colors.muted }}>
                    {t.description}
                  </p>
                  {/* Popularity */}
                  <div className="flex items-center gap-1 mb-2">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <div key={i} style={{
                        width: 8, height: 8, borderRadius: "50%",
                        background: i < t.popularity ? (domain?.color || colors.accent) : colors.border,
                      }} />
                    ))}
                    <span className="text-[0.6rem] ml-1" style={{ color: colors.muted }}>popularite</span>
                  </div>
                  {/* Usage */}
                  <div style={{
                    background: colors.bg,
                    borderRadius: 6,
                    padding: "8px 12px",
                    fontFamily: "'Fira Code', monospace",
                    fontSize: "0.68rem",
                    color: domain?.color || colors.accent,
                    border: `1px solid ${colors.border}`,
                    overflowX: "auto",
                  }}>
                    <span style={{ color: colors.muted, marginRight: 6 }}>$</span>
                    {t.usage}
                  </div>
                  {domain && (
                    <div className="mt-2">
                      <span className="text-[0.6rem] px-2 py-0.5 rounded font-semibold" style={{
                        background: domain.color + "15", color: domain.color,
                      }}>
                        {domain.name}
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ═══════════════════ SIMULATIONS SECTION ═══════════════════ */}
      {section === "simulations" && !activeSim && (
        <div>
          <p className="text-sm mb-4" style={{ color: colors.muted }}>
            Vis des scenarios reels etape par etape. Chaque simulation te plonge dans une situation concrete avec les outils, les decisions, et les resultats.
          </p>
          <div className="grid gap-4" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))" }}>
            {SIMULATIONS.map((sim) => {
              const Icon = sim.icon;
              return (
                <div
                  key={sim.id}
                  onClick={() => { setActiveSim(sim.id); setSimStep(0); setSimRevealed(false); }}
                  style={{
                    ...cardStyle(true),
                    borderTop: `3px solid ${sim.color}`,
                  }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.transform = "translateY(-3px)"; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.transform = "none"; }}
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div style={{ background: sim.color + "20", borderRadius: 10, padding: 10 }}>
                      <Icon size={24} style={{ color: sim.color }} />
                    </div>
                    <div className="flex-1">
                      <div className="font-bold text-sm" style={{ color: colors.text }}>{sim.title}</div>
                      <div className="text-xs mt-0.5" style={{ color: colors.muted }}>{sim.steps.length} etapes</div>
                    </div>
                  </div>
                  <p className="text-xs leading-relaxed mb-3" style={{ color: colors.muted }}>
                    {sim.context.slice(0, 120)}...
                  </p>
                  {sim.budget && (
                    <div className="flex items-center gap-1.5 text-xs" style={{ color: colors.warn }}>
                      <DollarSign size={12} /> {sim.budget}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Active Simulation */}
      {section === "simulations" && activeSim && currentSim && (
        <div>
          <button
            onClick={() => { setActiveSim(null); }}
            className="flex items-center gap-1.5 text-xs mb-4 cursor-pointer"
            style={{ background: "none", border: "none", color: colors.accent, fontFamily: "inherit" }}
          >
            <RotateCcw size={13} /> Retour aux simulations
          </button>

          {/* Sim header */}
          <div style={{ ...cardStyle(), marginBottom: 16, borderTop: `3px solid ${currentSim.color}` }}>
            <div className="flex items-center gap-3 mb-3">
              <currentSim.icon size={24} style={{ color: currentSim.color }} />
              <h2 className="text-base font-bold" style={{ color: colors.text, margin: 0 }}>{currentSim.title}</h2>
            </div>
            <p className="text-xs leading-relaxed mb-3" style={{ color: colors.text }}>
              {currentSim.context}
            </p>
            {currentSim.budget && (
              <div className="flex items-center gap-2 text-xs" style={{ color: colors.warn }}>
                <DollarSign size={13} /> Budget typique : {currentSim.budget}
              </div>
            )}
          </div>

          {/* Step progress */}
          <div className="flex items-center gap-1 mb-4">
            {currentSim.steps.map((_, i) => (
              <div key={i} className="flex-1" style={{
                height: 4,
                borderRadius: 2,
                background: i <= simStep ? currentSim.color : colors.border,
                transition: "background 0.3s",
              }} />
            ))}
          </div>

          {/* Current step */}
          {(() => {
            const step = currentSim.steps[simStep];
            return (
              <div style={cardStyle()}>
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-xs font-bold px-2 py-0.5 rounded" style={{
                    background: currentSim.color + "20", color: currentSim.color,
                  }}>
                    Etape {simStep + 1}/{currentSim.steps.length}
                  </span>
                  {step.tool && (
                    <span className="text-xs px-2 py-0.5 rounded flex items-center gap-1" style={{
                      background: colors.surface, border: `1px solid ${colors.border}`, color: colors.muted,
                    }}>
                      <Terminal size={11} /> {step.tool}
                    </span>
                  )}
                </div>

                <h3 className="text-sm font-bold mb-2" style={{ color: colors.text }}>{step.title}</h3>
                <p className="text-xs leading-relaxed mb-4" style={{ color: colors.muted }}>
                  {step.description}
                </p>

                {!simRevealed ? (
                  <Button
                    onClick={() => { setSimRevealed(true); setSimProgress(0); }}
                    style={{ background: currentSim.color }}
                  >
                    <Zap size={14} /> {step.action}
                  </Button>
                ) : (
                  <div>
                    {/* Loading bar animation */}
                    {simProgress < 100 && (
                      <div style={{ marginBottom: 12 }}>
                        <div style={{
                          height: 3, background: colors.border, borderRadius: 3, overflow: "hidden",
                        }}>
                          <div style={{
                            height: "100%", width: `${simProgress}%`,
                            background: currentSim.color,
                            transition: "width 0.05s linear",
                          }} />
                        </div>
                        <div className="text-xs mt-1 flex items-center gap-1.5" style={{ color: currentSim.color }}>
                          <Clock size={11} /> Execution en cours...
                        </div>
                      </div>
                    )}
                    {simProgress >= 100 && (
                      <div style={{
                        background: currentSim.color + "10",
                        border: `1px solid ${currentSim.color}30`,
                        borderRadius: 8,
                        padding: 16,
                        marginBottom: 16,
                      }}>
                        <div className="flex items-center gap-2 mb-2">
                          <CheckCircle size={15} style={{ color: currentSim.color }} />
                          <span className="text-xs font-bold" style={{ color: currentSim.color }}>Resultat</span>
                        </div>
                        <p className="text-xs leading-relaxed" style={{ color: colors.text }}>
                          {step.result}
                        </p>
                      </div>
                    )}
                    {simProgress >= 100 && (
                      <div className="flex gap-2">
                        {simStep + 1 < currentSim.steps.length ? (
                          <Button onClick={() => { setSimStep((s) => s + 1); setSimRevealed(false); }}>
                            Etape suivante <ArrowRight size={14} />
                          </Button>
                        ) : (
                          <div className="flex items-center gap-3">
                            <div style={{
                              background: colors.success + "15",
                              border: `1px solid ${colors.success}30`,
                              borderRadius: 8,
                              padding: "8px 16px",
                            }}>
                              <span className="text-xs font-bold flex items-center gap-2" style={{ color: colors.success }}>
                                <Award size={15} /> Simulation terminee !
                              </span>
                            </div>
                            <Button variant="ghost" onClick={() => { setActiveSim(null); }}>
                              Retour
                            </Button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })()}

          {/* Timeline of all steps */}
          <div className="mt-4">
            <div className="flex flex-col gap-0">
              {currentSim.steps.map((s, i) => (
                <div
                  key={i}
                  className="flex items-start gap-3 cursor-pointer"
                  style={{ opacity: i <= simStep ? 1 : 0.4, padding: "8px 0" }}
                  onClick={() => { if (i <= simStep) { setSimStep(i); setSimRevealed(false); } }}
                >
                  <div style={{
                    width: 24, height: 24, borderRadius: "50%", flexShrink: 0,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: "0.65rem", fontWeight: 700,
                    background: i < simStep ? currentSim.color : (i === simStep ? currentSim.color + "30" : colors.border),
                    color: i < simStep ? "#fff" : (i === simStep ? currentSim.color : colors.muted),
                  }}>
                    {i < simStep ? <CheckCircle size={13} /> : i + 1}
                  </div>
                  <div>
                    <div className="text-xs font-bold" style={{ color: i <= simStep ? colors.text : colors.muted }}>
                      {s.title}
                    </div>
                    {s.tool && (
                      <div className="text-[0.6rem] mt-0.5" style={{ color: colors.muted }}>{s.tool}</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}