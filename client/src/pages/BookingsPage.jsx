import AccountNav from "../AccountNav";
import { useEffect, useState } from "react";
import axios from "axios";
import PlaceImg from "../PlaceImg";
// import { differenceInCalendarDays, format } from "date-fns";
import { Link } from "react-router-dom";
import BookingDates from "../BookingDates";

export default function BookingsPage() {
  const [bookings, setBookings] = useState([]);
  const [requestStates, setRequestStates] = useState({
    loading: false,
    error: false,
  })
  useEffect(() => {
    setRequestStates(prev => ({
      ...prev, loading: true,
    }))
    try {
      axios.get('/bookings').then(response => {
        setBookings(response.data);
      });
      setRequestStates(prev => ({
        ...prev, loading: false,
      }))
    } catch (e) {
      console.log(e)
      setRequestStates(prev => ({
        ...prev, loading: false, error: true
      }))
    }

  }, []);
  return (
    <div>
      <AccountNav />
      {
        requestStates.loading ? (
          <div className="flex justify-center items-center">

            <h2 className="text-gray-800">Loading...</h2>

          </div>) : !requestStates.loading && requestStates.error ? (
            <div className="flex justify-center items-center">

              <h2 className="text-gray-800">No bookings present at the moment</h2>

            </div>
          ) :
          <div>
            {bookings?.length > 0 ? bookings.map(booking => (
              <Link to={`/account/bookings/${booking._id}`} className="flex gap-4 bg-gray-200 rounded-2xl overflow-hidden" key={booking._id}>
                <div className="w-48">
                  <PlaceImg place={booking.place} />
                </div>
                <div className="py-3 pr-3 grow">
                  <h2 className="text-2xl mt-3">{booking.place.title}</h2>
                  <div className="text-xl ">
                    <BookingDates booking={booking} className="mb-2 mt-7 text-gray-500" />
                    <div className="flex gap-1 mt-5">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z" />
                      </svg>
                      <span className="text-xl">
                        Total price: ${booking.price}
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            )) : <div className="flex justify-center items-center">

              <h2 className="text-gray-800">No bookings present at the moment</h2>

            </div>
            }
          </div>
      }


    </div>
  );
}