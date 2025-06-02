
interface SuccessRateMeterProps {
    successRate: string;
    successCount: string;
    failCount: string;
  }
const SuccessRateMeter: React.FC<SuccessRateMeterProps> = ({ successRate=0, successCount, failCount }) => {
    return (
      <div
        style={{
          background:
            "linear-gradient(270deg, #37EB3E 0.01%, #EBD937 50.55%, #EB3737 107.42%)",
        }}
        className="h-[2rem] w-full rounded-[5px] "
      >
        <div
        style={{
          right:`${successRate-1}%`
        }} 
        className="relative flex h-full w-full justify-end ">
              <div
                style={{
                  boxShadow: "0px 6px 5px 0px rgba(0, 0, 0, 0.25)",
                }}
                className="relative -my-1 h-[2.5rem] w-2 cursor-pointer rounded-full bg-white"
              ></div>
        </div>
        <div className="flex w-full justify-between mt-3 text-xs">
          <p>0</p>
          <p>50</p>
          <p>100</p>

        </div>
      </div>
    );
  };

  export default SuccessRateMeter;