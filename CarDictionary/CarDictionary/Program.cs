using Microsoft.EntityFrameworkCore;
using CarDictionary.Models;
using System.Text;

namespace CarDictionary
{
    public class Program
    {
        // Path to database backup file
        public static readonly string BackupFilePath = Path.Combine(Environment.CurrentDirectory, "cars.txt");
        // Saving current database state to backup file
        private static void SaveDatabaseToFile(CarDictionaryDb db)
        {
            StreamWriter sw = new (BackupFilePath);
            List<Car> data = db.Cars.ToList();
            if (data == null) {
                sw.Write("");
                sw.Close();
                return;
            }
            string textData = string.Join("\n", data.Select(x => string.Join(",", new List<string>() { x.PlateNumber, x.Color, x.Brand, x.Year.ToString() })));
            sw.Write(textData);
            sw.Close();
        }
        // Setting up database from backup file when API starts
        async private static void PreloadDatabase(CarDictionaryDb db)
        {
            try { 
                StreamReader sr = new (BackupFilePath);
                string data = sr.ReadToEnd();
                if (data == "") { sr.Close(); return; }
                var cars = data.Split("\n", StringSplitOptions.RemoveEmptyEntries).Select(x => x.Trim().Split(','));
                var a = cars
                    .Select(x => new Car { PlateNumber = x[0], Color = x[1], Brand = x[2], Year = int.Parse(x[3]) })
                    .ToList();
                if (a.Count == 0) return;
                foreach (var i in a) { db.Cars.Add(i); };
                await db.SaveChangesAsync();
                sr.Close();
            }
            catch (FileNotFoundException) { return; }
        }

        public static void Main(string[] args)
        {
            var myOrigin = "_myOrigin";
            var isLaunched = false;

            var builder = WebApplication.CreateBuilder(args);
            builder.Services.AddDbContext<CarDictionaryDb>(opt => opt.UseInMemoryDatabase("Cars"));
            builder.Services.AddDatabaseDeveloperPageExceptionFilter();
            // Permission to send any requests from other origins
            builder.Services.AddCors(options =>
            {
                options.AddPolicy(name: myOrigin, policy => { policy.AllowAnyOrigin().AllowAnyHeader().AllowAnyMethod(); });
            });

            var app = builder.Build();
            app.UseDefaultFiles();
            app.UseStaticFiles();
            app.UseCors(myOrigin);

            //"GET"
            app.MapGet("/cars", async (CarDictionaryDb db) =>
            {
                if (!isLaunched) { PreloadDatabase(db); isLaunched = true; }
                return await db.Cars.ToListAsync();
            });

            //"GET: statistics"
            app.MapGet("/cars/stat", async (CarDictionaryDb db) => { 
                var data = await db.Cars.ToListAsync();
                return data.Count.ToString();
            });

            //"POST"
            app.MapPost("/cars", async (Car car, CarDictionaryDb db) =>
            {
                db.Cars.Add(car);
                await db.SaveChangesAsync();
                SaveDatabaseToFile(db);

                return Results.Created($"/cars/{Encoding.ASCII.GetString(
                    Encoding.Convert(Encoding.UTF8, Encoding.ASCII, Encoding.UTF8.GetBytes(car.PlateNumber)))}", car);
            });

            //"DELETE"
            app.MapDelete("/cars/{plateNumber}", async (string plateNumber, CarDictionaryDb db) =>
            {
                if (await db.Cars.FindAsync(plateNumber) is Car car)
                {
                    db.Cars.Remove(car);
                    await db.SaveChangesAsync();
                    SaveDatabaseToFile(db);
                    return Results.NoContent();
                }

                return Results.NotFound();
            });

            app.Run();
        }
    }
}