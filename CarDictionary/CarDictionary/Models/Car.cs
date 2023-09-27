using System.ComponentModel.DataAnnotations;

namespace CarDictionary.Models
{
    public class Car
    {
        [Key]
        public string PlateNumber { get; set; }
        public string Brand { get; set; }
        public string Color { get; set; }
        public int Year { get; set; }
    }
}
