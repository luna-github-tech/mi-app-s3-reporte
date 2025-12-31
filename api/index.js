import { S3Client, ListObjectsV2Command } from "@aws-sdk/client-s3";
import { format, subDays, eachDayOfInterval } from "date-fns";

export default async (req, res) => {
  const { S3_BUCKET_NAME, S3_PREFIX, AWS_REGION } = process.env;

  if (!S3_BUCKET_NAME || !S3_PREFIX || !AWS_REGION) {
    return res.status(500).json({ error: "AWS environment variables are not configured." });
  }

  const s3Client = new S3Client({
    region: AWS_REGION,
  });

  const allBranches = [
      "VeracruzSucVegas",
      "VeracruzSucCostaVerde",
      "VeracruzSucDiazMiron",
      "VeracruzSucIcazo",
      "VeracruzSucMarti",
      "VeracruzSucNuevoVeracruz",
      "VeracruzSucPatioTejeria",
      "VeracruzSucPlazaAmericas",
      "VeracruzSucPlazaCristal",
      "VeracruzSucRiviera",
      "VeracruzSucUrbanCenter",
      "VeracruzSucMarioMolina",
      "VeracruzSucWalmart",
      "VeracruzSucTejeria",
      "VeracruzSucAlmacen",
      "XalapaSucEnriquez",
      "XalapaSucHakim",
      "XalapaSucMurilloVidal",
      "XalapaSucSebastian",
      "XalapaSucSuperama",
      "CoatepecSucStaCecilia",
      "XalapaSucAraucarias2",
      "XalapaSucPlazaPradera",
      "BanderillaSucBanderilla1",
      "XalapaSucTostador",
      "PueblaSucSanAngel",
      "PueblaSuc3SurSoft",
      "XalapaSucAtenas",
      "XalapaSucMiguelAleman",
      "XalapaSucPlazaAmericas",
      "XalapaEstacionamientoEnriquez",
      "XalapaEstacionamientoRevolucion",
      "MexicoSucPedregal",
      "MexicoSucCondesaSoft",
      "SucOrizabaRIFR"

  ];

  try {
    const today = new Date();
    const lastFiveDays = subDays(today, 4);
    const dateRange = eachDayOfInterval({ start: lastFiveDays, end: today });
    const formattedDates = dateRange.map(date => format(date, 'yyyy-MM-dd'));

    const dailyReport = {};
    formattedDates.forEach(date => {
      dailyReport[date] = {};
      allBranches.forEach(branch => {
        dailyReport[date][branch] = '❌'; // Inicializar cada día como 'sin respaldo'
      });
    });

    const command = new ListObjectsV2Command({
      Bucket: S3_BUCKET_NAME,
      Prefix: S3_PREFIX,
    });

    const { Contents } = await s3Client.send(command);

    if (Contents) {
      Contents.forEach(file => {
        const lastModified = new Date(file.LastModified);
        const fileDate = format(lastModified, 'yyyy-MM-dd');
        const fileName = file.Key.split('/').pop();

        if (fileDate in dailyReport && fileName.includes('_')) {
          const branchName = fileName.split('_')[0];
          if (branchName in dailyReport[fileDate]) {
            dailyReport[fileDate][branchName] = '✅'; // Marcar como 'con respaldo' si se encuentra un archivo
          }
        }
      });
    }

    res.status(200).json({ allBranches, dailyReport, formattedDates });

  } catch (error) {
    console.error("Error fetching S3 data:", error);
    res.status(500).json({ error: "Failed to fetch S3 data.", details: error.message });
  }
};
