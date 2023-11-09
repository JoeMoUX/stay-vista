import { useEffect, useState } from "react";
import {
  Link,
  // Navigate, 
  useParams
} from "react-router-dom";
import AccountNav from "../AccountNav";
import axios from "axios";
import PlaceImg from "../PlaceImg";



const PlacesPage = () => {
  const { action } = useParams()
  const [places, setPlaces] = useState([]);

  useEffect(() => {
    axios.get('/user-places').then(({ data }) => {
      // console.log("data from places request", data)
      setPlaces(data);
    });
  }, []);

  return (
    <div>
      <AccountNav />
      {
        action !== "new" && (
          <div className="text-center">

            {/* <br /> */}
            <Link className="inline-flex gap-1 bg-primary text-white py-2 px-6 rounded-full" to={'/account/places/new'}>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
                <path fillRule="evenodd" d="M12 3.75a.75.75 0 01.75.75v6.75h6.75a.75.75 0 010 1.5h-6.75v6.75a.75.75 0 01-1.5 0v-6.75H4.5a.75.75 0 010-1.5h6.75V4.5a.75.75 0 01.75-.75z" clipRule="evenodd" />
              </svg>
              Add new place
            </Link>
          </div>
        )
      }

      {/* {
        action === "new" && (
          <PlacesFormPage />
        )
      } */}
      <div className="mt-8">
        {places.length > 0 && places.map(place => (
          <Link key={place._id} to={'/account/places/' + place._id} className="flex cursor-pointer gap-4 bg-gray-100 p-4 rounded-2xl my-5">
            <div className="flex w-32 h-32 bg-gray-300 grow shrink-0">
              <PlaceImg place={place} />
            </div>
            <div className="grow-0 shrink">
              <h2 className="text-xl">{place.title}</h2>
              <p className="text-sm mt-2">{place.description}</p>
            </div>
          </Link>
        ))}
      </div>

    </div>
  );
}

export default PlacesPage

// https://media.istockphoto.com/id/1307713029/photo/rhododendron-flowers-blooming-on-the-high-wild-mountains-beautiful-sunrise-on-the-spring.jpg?s=2048x2048&w=is&k=20&c=DTt3rRgcW1JICfCNu8p7R5uC1dnNiv_mmADWd3_yA44=


// https://media.istockphoto.com/id/1403500817/photo/the-craggies-in-the-blue-ridge-mountains.jpg?s=2048x2048&w=is&k=20&c=V1LRnPCSzAwCxYoRadXQKQHaGiBRt6TO2btwLLcYcL4=

// https://media.istockphoto.com/id/1302806640/photo/sunset-and-hill-view-of-sajek-valley-at-rangamati-in-coxs-bazar.jpg?s=2048x2048&w=is&k=20&c=BS1Tn_kPSx0EoCgWczqPf-g6kwwJ7J5Thht-31njN70=