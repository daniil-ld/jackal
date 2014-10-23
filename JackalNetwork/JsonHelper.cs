using Newtonsoft.Json;

namespace JackalNetwork
{
    public static class JsonHelper
    {

        private static readonly JsonSerializerSettings _typeNameSerializer = new JsonSerializerSettings() { TypeNameHandling = TypeNameHandling.Objects };

        public static string SerialiazeWithType<T>(T obj, Formatting formatting = Formatting.None)
        {
            return JsonConvert.SerializeObject(obj, formatting, _typeNameSerializer);
        }

        public static T DeserialiazeWithType<T>(string str)
        {
            return JsonConvert.DeserializeObject<T>(str, _typeNameSerializer);
        }

    }
}