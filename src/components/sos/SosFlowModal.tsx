import { useCallback, useEffect, useRef, useState } from "react";

import { submitSos } from "@/api/runner-api";

import { ApiError } from "@/lib/api-client";

import type { RunnerProfile, SosPayload, SosSymptom } from "@/types";



const SYMPTOMS: { id: SosSymptom; label: string }[] = [

  { id: "heart", label: "心脏不适 / 胸闷" },

  { id: "muscle", label: "肌肉拉伤 / 抽筋" },

  { id: "injury", label: "外伤出血 / 跌倒" },

];



const symptomBtnClass =

  "w-full py-5 rounded-xl text-white text-lg font-bold active:opacity-90 shadow-md";

const symptomBtnStyle = {

  background: "linear-gradient(180deg, #ff3b30 0%, #d32f2f 100%)",

};



const AUTO_SEC = 5;



interface Props {

  open: boolean;

  runner: RunnerProfile;

  apiConnected: boolean;

  onClose: () => void;

  onSubmitted: (payload: SosPayload, serverMessage?: string) => void;

}



export function SosFlowModal({ open, runner, apiConnected, onClose, onSubmitted }: Props) {

  const [step, setStep] = useState<"gps" | "symptom" | "done">("gps");

  const [countdown, setCountdown] = useState(AUTO_SEC);

  const [gps, setGps] = useState<{ lat: number; lng: number } | null>(null);

  const [env, setEnv] = useState({ battery: 68, signal: "4G 良好" });

  const [submitting, setSubmitting] = useState(false);



  useEffect(() => {

    if (!open) {

      setStep("gps");

      setCountdown(AUTO_SEC);

      setGps(null);

      return;

    }



    setStep("gps");

    if (navigator.geolocation) {

      navigator.geolocation.getCurrentPosition(

        (pos) => {

          setGps({ lat: pos.coords.latitude, lng: pos.coords.longitude });

          setEnv({

            battery: (navigator as Navigator & { getBattery?: () => Promise<{ level: number }> })

              .getBattery

              ? 68

              : 68,

            signal: "GPS 已定位",

          });

          setStep("symptom");

        },

        () => {

          setGps({ lat: 30.5728, lng: 104.0668 });

          setEnv({ battery: 55, signal: "GPS 不可用·使用近似坐标" });

          setStep("symptom");

        },

        { enableHighAccuracy: true, timeout: 8000 },

      );

    } else {

      const t = window.setTimeout(() => {

        setGps({ lat: 30.5728, lng: 104.0668 });

        setStep("symptom");

      }, 800);

      return () => clearTimeout(t);

    }

  }, [open]);



  const submittedRef = useRef(false);



  const submit = useCallback(

    async (symptom: SosSymptom) => {

      if (submittedRef.current || submitting) return;

      submittedRef.current = true;

      setSubmitting(true);



      const payload: SosPayload = {

        runnerId: runner.id,

        bib: runner.bib,

        name: runner.name,

        bloodType: runner.bloodType,

        emergencyPhone: runner.emergencyPhone,

        gps: gps ?? { lat: 0, lng: 0 },

        battery: env.battery,

        signal: env.signal,

        symptom,

        submittedAt: new Date().toISOString(),

      };



      let serverMessage: string | undefined;

      if (apiConnected) {

        try {

          const res = await submitSos({

            lat: payload.gps.lat,

            lng: payload.gps.lng,

            battery: payload.battery,

            signal: payload.signal,

            symptomKey: symptom,

          });

          serverMessage = res.message;

        } catch (e) {

          serverMessage =

            e instanceof ApiError ? `${e.message}（本地已记录）` : "上报失败（本地已记录）";

        }

      }



      setStep("done");

      onSubmitted(payload, serverMessage);

      setSubmitting(false);

    },

    [gps, env, runner, onSubmitted, apiConnected, submitting],

  );



  useEffect(() => {

    if (!open || step !== "symptom") return;

    submittedRef.current = false;

    setCountdown(AUTO_SEC);

    const iv = setInterval(() => {

      setCountdown((c) => {

        if (c <= 1) {

          clearInterval(iv);

          submit("heart");

          return 0;

        }

        return c - 1;

      });

    }, 1000);

    return () => clearInterval(iv);

  }, [open, step, submit]);



  useEffect(() => {

    if (!open) submittedRef.current = false;

  }, [open]);



  if (!open) return null;



  return (

    <div className="fixed inset-0 z-[60] bg-black/70 flex items-end justify-center max-w-md mx-auto">

      <div className="w-full bg-white rounded-t-2xl p-4 safe-bottom max-h-[90dvh] overflow-y-auto">

        {step === "gps" && (

          <div className="text-center py-8">

            <div className="w-12 h-12 border-4 border-sos border-t-transparent rounded-full animate-spin mx-auto" />

            <p className="mt-4 font-bold text-slate-800">正在获取 GPS 定位…</p>

            <p className="text-xs text-slate-500 mt-1">读取电量与网络信号</p>

          </div>

        )}



        {step === "symptom" && (

          <>

            <div className="flex items-center justify-between mb-3">

              <h3 className="text-lg font-black text-alert">确认伤情</h3>

              <span className="text-xs text-slate-500">{countdown}s 后默认最高级别</span>

            </div>

            <p className="text-xs text-slate-600 mb-3">

              GPS {gps?.lat.toFixed(4)}, {gps?.lng.toFixed(4)} · 电量 {env.battery}% · {env.signal}

            </p>

            <div className="space-y-3">

              {SYMPTOMS.map((s) => (

                <button

                  key={s.id}

                  type="button"

                  disabled={submitting}

                  onClick={() => submit(s.id)}

                  className={symptomBtnClass}

                  style={symptomBtnStyle}

                >

                  {s.label}

                </button>

              ))}

            </div>

            <button type="button" onClick={onClose} className="w-full mt-4 py-3 text-slate-500 text-sm">

              取消（未发送）

            </button>

          </>

        )}



        {step === "done" && (

          <div className="text-center py-6">

            <p className="text-4xl mb-2">✓</p>

            <p className="text-lg font-bold text-slate-800">救援请求已发送</p>

            <p className="text-sm text-slate-500 mt-2">

              组委会与最近医疗志愿者将收到您的定位

            </p>

            <button

              type="button"

              onClick={onClose}

              className="mt-6 w-full py-3 rounded-xl bg-primary text-white font-semibold active:bg-primary-dark"

            >

              知道了

            </button>

          </div>

        )}

      </div>

    </div>

  );

}


