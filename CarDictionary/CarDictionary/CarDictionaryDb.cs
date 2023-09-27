using Microsoft.EntityFrameworkCore;
using CarDictionary.Models;

class CarDictionaryDb : DbContext
{
    public CarDictionaryDb(DbContextOptions<CarDictionaryDb> options)
        : base(options) { }

    public DbSet<Car> Cars => Set<Car>();
}