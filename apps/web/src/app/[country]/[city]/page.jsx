import { useEffect } from "react";

export default function CityIndexPage(props) {
  const { country, city } = props.params || {};
  useEffect(() => {
    if (typeof window !== "undefined") {
      window.location.replace(`/${country}/${city}/restaurants`);
    }
  }, [country, city]);
  return null;
}
