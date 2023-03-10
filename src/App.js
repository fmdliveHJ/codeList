import { useEffect, useState } from "react";
import { getReviews, createReview, updateReview, deleteReview } from "./api";
import useAsync from "./components/hooks/useAsync";
import ReviewForm from "./components/ReviewForm";
import ReviewList from "./components/ReviewList";

const LIMIT = 6;

function App() {
  const [order, setOrder] = useState("createdAt");
  //item state의 초기값으로 빈배열을 넣어줌
  const [items, setItems] = useState([]);
  //커스텀 훅 useAsync에 getReviews데이터 불러옴
  const [isLoading, loadingError, getReviewsAsync] = useAsync(getReviews);

  const [offset, setOffset] = useState(0);
  const sortedItems = items.sort((a, b) => b[order] - a[order]);

  //api에서 목록에 더 있는지 아닌지 hasNext로 확인할수 있음
  const [hasNext, setHasNext] = useState(false);
  //정렬 순서를 최신순
  const handleNewestClick = () => setOrder("createdAt");
  //정렬 순서를 베스트 rating인 베스트 순
  const handleBestClick = () => setOrder("rating");
  //
  const handleDelete = async (id) => {
    const result = await deleteReview(id);
    if (!result) return;
    setItems((prev) => prev.filter((item) => item.id !== id));
  };
  //비동기 함수
  //setItems에
  const handleLoad = async (option) => {
    let result = await getReviewsAsync(option);
    if (!result) return;
    //네트워크 리퀘스트전에 true로 만듬

    const { reviews, paging } = result;
    //페이지 네이션에서는 데이터를 일부부만 받아와서 items 배열에 요소들을 추가해주어야함
    if (option.offset === 0) {
      setItems(reviews);
    } else {
      //여기서 prev는 고정값이 아니라 현재시점의 state값을 말함
      //비동기에서 이전 state를 사용하려면 함수에서 콜백을 사용해서 이전state를 사용함
      setItems((prev) => [...prev, ...reviews]);
    }
    setOffset(option.offset + reviews.length);
    setHasNext(paging.hasNext);
  };

  //버튼 클릭시 핸들로드에 지금 offset값 6을 전달
  // offset값이 6이 아니기 때문에 이전 값들까지 담아서 출력
  const handleMore = () => {
    handleLoad({ order, offset, limit: LIMIT });
  };

  const handleCreateSuccess = (review) => {
    setItems((prev) => [review, ...prev]);
  };

  const handleUpdateSuccess = (review) => {
    setItems((prev) => {
      //수정할 아이템에 해당하는 index 찾음
      const splitIdx = prev.findIndex((item) => item.id === review.id);
      //prev 배열에서 같은 아이디 해당하는 리뷰를 찾아서 갈아 끼움
      return [...prev.slice(0, splitIdx), review, ...prev.slice(splitIdx + 1)];
    });
  };

  //useEffect 호출시 바로 콜백함수 실행하는 것이 아니라 예약해두었다가 렌더링이 끝나고 실행
  useEffect(() => {
    handleLoad({ order, offset: 0, limit: LIMIT });
  }, [order]);

  return (
    <div>
      <div>
        <button onClick={handleNewestClick}>최신순</button>
        <button onClick={handleBestClick}>베스트순</button>
      </div>
      <ReviewForm
        onSubmit={createReview}
        onSubmitSuccess={handleCreateSuccess}
      />
      <ReviewList
        items={sortedItems}
        onDelete={handleDelete}
        onUpdate={updateReview}
        onUpdateSuccess={handleUpdateSuccess}
      />
      {/* <button onClick={handleLoadClick}>불러오기</button> */}
      {hasNext && (
        <button disabled={isLoading} onClick={handleMore}>
          더보기
        </button>
      )}
      {loadingError?.message && <span>{loadingError.message}</span>}
    </div>
  );
}

export default App;

/**
 * 처음 app콤포넌트 실행하면 useEffect 실행 handleLoad실행
 * order, offsety , limit 리퀘스트 보냄
 * offset이 0이니까 리스폰스 받은 데이터로 items state 변경
 * (if문에 offset에 0이면 이라는 가정을 주어서 설정 )
 * 데이터를 6개 받아오면 offset state는 0 + 6
 *
 */
