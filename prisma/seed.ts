import { PrismaClient, FacultyType } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Iniciando seed de Facultades y Categorías Académicas...");

  // 1. FACULTAD DE MATEMÁTICAS
  const mathFaculty = await prisma.faculty.upsert({
    where: { type: FacultyType.MATHEMATICS },
    update: {},
    create: {
      type: FacultyType.MATHEMATICS,
      name: "Facultad de Matemáticas",
      slug: "matematicas",
      description: "Dominio de razonamiento abstracto, cálculo y resolución de problemas para preparación preuniversitaria y superior.",
      icon: "Calculator",
      color: "#3B82F6", // Blue
      categories: {
        create: [
          { name: "Álgebra", slug: "algebra", description: "Polinomios, ecuaciones, funciones, matrices y desigualdades." },
          { name: "Aritmética", slug: "aritmetica", description: "Teoría de números, proporciones, fracciones, porcentajes y probabilidad." },
          { name: "Geometría", slug: "geometria", description: "Geometría plana, del espacio, trigonometría y áreas." },
          { name: "Trigonometría", slug: "trigonometria", description: "Razones trigonométricas, identidades, transformaciones y ecuaciones." },
          { name: "Razonamiento Matemático (RM)", slug: "razonamiento-matematico", description: "Habilidad lógico-matemática, sucesiones, certezas y planteo de ecuaciones." },
        ],
      },
    },
  });

  // 2. FACULTAD DE CIENCIAS
  const scienceFaculty = await prisma.faculty.upsert({
    where: { type: FacultyType.SCIENCES },
    update: {},
    create: {
      type: FacultyType.SCIENCES,
      name: "Facultad de Ciencias",
      slug: "ciencias",
      description: "Estudio riguroso de las leyes que rigen la materia, la energía y los seres vivos.",
      icon: "Atom",
      color: "#10B981", // Emerald
      categories: {
        create: [
          { name: "Física", slug: "fisica", description: "Mecánica clásica, cinemática, electromagnetismo y termodinámica." },
          { name: "Química", slug: "quimica", description: "Estructura atómica, tabla periódica, enlaces químicos y estequiometría." },
          { name: "Biología", slug: "biologia", description: "Citología, genética, anatomía, ecología y evolución biológica." },
        ],
      },
    },
  });

  // 3. FACULTAD DE HUMANIDADES
  const humanitiesFaculty = await prisma.faculty.upsert({
    where: { type: FacultyType.HUMANITIES },
    update: {},
    create: {
      type: FacultyType.HUMANITIES,
      name: "Facultad de Humanidades",
      slug: "humanidades",
      description: "Comprensión del lenguaje, el entorno geográfico y los procesos históricos.",
      icon: "BookOpen",
      color: "#8B5CF6", // Purple
      categories: {
        create: [
          { name: "Razonamiento Verbal (RV)", slug: "razonamiento-verbal", description: "Comprensión lectora, analogías, términos excluidos y conectores lógicos." },
          { name: "Geografía", slug: "geografia", description: "Geografía del Perú y del mundo, climatología, cartografía y recursos naturales." },
          { name: "Historia del Perú", slug: "historia-del-peru", description: "Desde las culturas prehispánicas, el Virreinato hasta la República contemporánea." },
        ],
      },
    },
  });

  console.log("Facultades y Categorías sembradas con éxito:", {
    mathId: mathFaculty.id,
    scienceId: scienceFaculty.id,
    humanitiesId: humanitiesFaculty.id,
  });
}

main()
  .catch((e) => {
    console.error("Error durante el seed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
